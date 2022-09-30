import dotenv from 'dotenv'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import request from 'request'
import { EnvironmentType, FolderNameType } from '../types'

dotenv.config()

export const PL_SCRAPED = 'pl-scraped';

// TCL: delay needs to be above 1500 to publish reliably - reduce for testing
export const apiDelay = (delay = 1500) => new Promise((resolve) => setTimeout(resolve, delay)) // limit on contentstack api ('x' req/sec)

export const getFolderUid = (env: EnvironmentType, folder: FolderNameType) => {
  return process.env[`${env}_${folder}`]
}
const TMP_DIR = path.resolve(__dirname, '../tmp')

const createAssetLocally = (assetName) => new Promise(async (resolve) => {
  const writeStream = fs.createWriteStream(`${TMP_DIR}/${assetName}`)
  await request(`https://assets.parkholidays.com/assets/${assetName}`).pipe(writeStream)
  writeStream.on('finish', resolve)
})

const emptyAssetTmpDir = () => {
  fs.readdirSync(TMP_DIR).forEach(function(file, index) {
    fs.unlinkSync(`${TMP_DIR}/${file}`)
  })
}

export const findReferenceInCache = (context, cacheRef, id, contentUid = snakeCase(cacheRef)) => {
  const data = context.cache[cacheRef][id]
  if (data) {
    return [{
      'uid': data.uid,
      '_content_type_uid': contentUid
    }]
  }
}

export const createImageFolders = async (context, folder, subFolder, migrationConfig) => {
  const subFolderName = subFolder.replace('&', 'and')
  const foldersExist = Object.keys(context.cache[migrationConfig.name]).find((key) => {
    return context.cache[migrationConfig.name][key].folder === `${folder}/${subFolderName}/images`
  })
  if (foldersExist) {
    return context.cache[migrationConfig.name][foldersExist].folderUids
  }
  const folderUid = getFolderUid(context.env, folder)
  if (!folderUid) {
    console.error('Could not find a folder lookup. Aborting folder creation!')
    return
  }
  const headers = {
    'Content-Type': 'application/json',
    ...context.headers,
    'authorization': context.management_token,
  }
  const subRes = await fetch(`${context.base_url}/assets/folders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset: {
        name: subFolderName,
        'parent_uid': folderUid
      }
    })
  })
  const subFolderResponse = await subRes.json()
  const imgRes = await fetch(`${context.base_url}/assets/folders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset: {
        name: 'Images',
        'parent_uid': subFolderResponse.asset.uid
      }
    })
  })
  const vidRes = await fetch(`${context.base_url}/assets/folders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset: {
        name: 'Videos',
        'parent_uid': subFolderResponse.asset.uid
      }
    })
  })
  const imageResponse = await imgRes.json()
  const videoResponse = await vidRes.json()
  return {
    imageFolderUid: imageResponse.asset.uid,
    videoFolderUid: videoResponse.asset.uid
  }
}

export const publishAsset = async (context, assetUid) => {
  try {
    const res = await fetch(`${context.base_url}/assets/${assetUid}/publish`, {
      method: 'POST',
      headers: {
        ...context.headers,
        'authorization': context.management_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "asset": {
          "locales": ["en-gb"],
          "environments": JSON.parse(process.env[`${context.env}_environments`]) // i.e. production / qa / preview
        },
        "version": 1,
        "scheduled_at": "2019-02-08T18:30:00.000Z"
      })
    })
  } catch (err) {
	  console.error("publishAsset -> err", err)
    throw new Error(err);
  }
}


const uploadFileToContentStack = (context, asset, tags, folderUid) => new Promise<{asset: { uid?: string }}>((resolve, reject) => {
  const { log } = context;
  try {
    request.post({
      headers: {
        ...context.headers,
        'authorization': context.management_token,
        'Content-Type' : 'multipart/form-data'
      },
      url: `${context.base_url}/assets`,
      formData: {
        'asset[upload]': {
          value: request.get(asset.path),
          options: {
            filename: asset.filename,
            contentType: 'image/jpeg'
          }
        },
        'asset[parent_uid]': folderUid,
        'asset[description]': asset.description,
        'asset[tags]': tags.map((tag) => tag.slice(0, 50)).join(','), // Contentstack restriction 50 chars
      }
    }, (err, res, body) => {
      if (err || res.statusCode < 200 || res.statusCode > 299) {
        const errorMsg = err || `Error status code: ${res.statusCode}`;
        log.error(errorMsg);
        log.error(res);
        throw new Error(errorMsg);
      }
      return resolve(JSON.parse(body));
    })

  } catch (error) {
    log.error("uploadFileToContentStack -> error", error);
    resolve({ asset: null });
  }
})

export const uploadAssets = async (context, assets, folderName, folderUid, tags, createCacheEntry) => {
  if (!folderUid) {
    console.error('Could not find a folder uid. Aborting asset upload!')
    return
  }

  const responses = {}
  for (const asset of assets) {
    const recordCount = Object.keys(responses).length + 1;
    process.stdout.write(`Uploading assets: [ ${folderName} ] ${recordCount} ${' '.repeat(25)}\r`);
    await apiDelay(500);
    try {
      const response = await uploadFileToContentStack(context, asset, tags, folderUid);
      await publishAsset(context, response.asset.uid);
      responses[asset.id] = createCacheEntry(asset, response);
    } catch (error) {
      console.error("uploadAssets -> error", error);
      throw new Error(error);
    }
  }
  return responses;
}

export const updateAssetTags = async (context, asset, tags) => {
  try {
    if (!asset.uid)  throw new Error('No asset.uid available');
    await apiDelay(300)
    const res = await fetch(`${context.base_url}/assets/${asset.uid}`, {
      method: 'PUT',
      headers: {
        ...context.headers,
        'authorization': context.management_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        asset: {
          tags: tags.map((tag) => tag.slice(0, 50)).join(','), // Contentstack restriction 50 chars

        },
      })
    })
    const response = await res.json();
    return response;
  } catch (error) {
    console.error("uploadAssets -> updateAssetTags -> error", error)
    throw new Error(error);
  }
}

export const publishEntry = async (context, contentUid, responseEntry, entry) => {
  try {
    /* WITHOUT REFERENCES */
    // const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries/${responseEntry.uid}/publish`, {
    //   method: 'POST',
    //   headers: {
    //     ...context.headers,
    //     'authorization': context.management_token,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     "entry": {
    //       "locales": ["en-gb"],
    //       "environments": JSON.parse(process.env[`${context.env}_environments`]) // i.e. production / qa / preview
    //     },
    //     "version": 1,
    //     "scheduled_at": "2019-02-08T18:30:00.000Z"
    //   })
    // })
    /* WITH ALL REFERENCES */
    const res = await fetch(`${context.base_url}/bulk/publish?x-bulk-action=publish`, {
      method: 'POST',
      headers: {
        ...context.headers,
        'authorization': context.management_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "entries": [{
          "uid": responseEntry.uid,
          "content_type": contentUid,
          "version": 1,
          "locale": "en-gb"
        }],
        "locales": ["en-gb"],
        "environments": JSON.parse(process.env[`${context.env}_environments`]), // i.e. production / qa / preview,
        "publish_with_reference": true,
        "skip_workflow_stage_check": true
      })
    })
    const publishEntryResponse = await res.json()
    if (publishEntryResponse.errors) {
      console.error('\npublishEntry -> error: ', publishEntryResponse, 'contentUid', contentUid)
      console.error('responseEntry -> ', responseEntry, 'entry', entry)
    }
  } catch(err) {
	  console.error("publishEntry -> err", err)

  }
}

export const arrayToUidKeyedObject = (arr) => arr.reduce((obj, item) => {
  obj[item.uid] = item
  return obj
}, {})

export const findCachedEntry = (migrationConfig, context, entry) => {
  if (entry['featureStrLc']) {
    return findCachedEntryFromFeatureStrLc(context, migrationConfig['name'], entry)
  }
  const entryId = entry.id || entry.uid
  if (context.cache[migrationConfig.name][entryId]) {
    return context.cache[migrationConfig.name][entryId].uid
  }
}

const findCachedEntryFromFeatureStrLc = (context, cacheRef, entry) => {
  const cache = context.cache[cacheRef];
  const response = Object.keys(cache).reduce<{ uid: string, id: string } | null>((foundItem, id) => {
    if (!foundItem && cache[id].featureStrLc === entry.featureStrLc) {
      foundItem = {
        ...cache[id],
        id
      }
    }
    return foundItem;
  }, null)
  return response;
}


export const findCachedEntryFromUid = (context, cacheRef, entry) => {
  const cache = context.cache[cacheRef];
  const response = Object.keys(cache).reduce<{ uid: string, id: string } | null>((foundItem, id) => {
    if (!foundItem && cache[id].uid === entry.uid) {
      foundItem = {
        ...cache[id],
        id
      }
    }
    return foundItem;
  }, null)
  return response;
}

const blacklistKeys = {
  created_at: true,
  updated_at: true,
  created_by: true,
  // season_start_date: true,
  // season_end_date: true,
  updated_by: true,
  is_dir: true,
  _version: true,
  _metadata: true,
  content_type: true,
  ACL: true,
  _in_progress: true,
  locale: true,
};

const scrubExistingData = (existingData) => {
  // This existing data is needed for arrays in particular.
  // Whilst updating things like contextual_images an empty array
  // removes all the data, whereas we should just be leaving it alone.
  // This comes from having a nested keyMap obj for updates.
  const data = { ...existingData };
  return Object.keys(data).reduce((acc, key) => {
    const formatted = { ...acc };
    /* if (key === 'image' && data['image']?.uid) {
      formatted['image'] = data[key].uid;
    } else */ if (data[key]?.filename && data[key]?.uid) { // This is an asset - just return uid
      formatted[key] = data[key].uid;
    } else if (!blacklistKeys[key]) {
      if (typeof data[key] === 'object') {
        if (Array.isArray(data[key])) {
          formatted[key] = data[key].map((item) => scrubExistingData(item));
        } else {
          formatted[key] = scrubExistingData(data[key]);
        }
      } else {
        formatted[key] = data[key]
      }
    }
    return formatted;
  }, {});
}

const removeUnwantedDataUsingKeyMap = (keyMap: {}, dataObj, existingData) => {
  return Object.keys(dataObj).reduce((acc, dataKey) => {
    const data = {...acc}
    if (!keyMap[dataKey]) {
      return {
        ...data,
        [dataKey]: existingData[dataKey]
      };
    }
    if (typeof keyMap[dataKey] === 'object') {
      if (Array.isArray(keyMap[dataKey])) {
        data[dataKey] = dataObj[dataKey].reduce((acc, curr, index) => [
          ...acc,
          removeUnwantedDataUsingKeyMap(keyMap[dataKey][0], curr, existingData[dataKey][index])
        ], [])
      } else {
        data[dataKey] = removeUnwantedDataUsingKeyMap(keyMap[dataKey], dataObj[dataKey], existingData[dataKey])
      }
    } else {
      data[dataKey] = dataObj[dataKey]
    }
    return data
  }, {})
}

export const createEntries = async (migrationConfig, context, contentUid, entries, createBody, createCacheEntry) => {
  const responses = {}
  for (const entry of entries) {
    const recordCount = Object.keys(responses).length + 1
    process.stdout.write(`Creating entries: [ ${contentUid} ] ${recordCount} \r`)
    const existingEntryUid = findCachedEntry(migrationConfig, context, entry)
    if (existingEntryUid && migrationConfig.updateKeys === 'none') {
      responses[entry.id] = context.cache[migrationConfig.name][entry.id]
    } else {
      await apiDelay(500)
      let body = await createBody(entry)
      let method = 'POST'
      let url = `${context.base_url}/content_types/${contentUid}/entries`
      if (existingEntryUid) {
        url += `/${existingEntryUid}`
        method = 'PUT'
        if (migrationConfig.updateKeys !== 'all') {
          let existingData = await getEntry(context, contentUid, existingEntryUid);
          existingData = scrubExistingData(existingData);
          body = removeUnwantedDataUsingKeyMap(migrationConfig.updateKeys, body, existingData);
        }
        body.entry.uid = existingEntryUid
      }
      url += '?locale=en-gb'
      body.entry.tags = [ PL_SCRAPED, ...(body.entry?.tags ?? []) ];

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...context.headers
        },
        body: JSON.stringify(body)
      })
      const response = await res.json()
      if (response['error_code']) {
        if (response['error_code'] === 119 && response.errors?.title && response.errors.title[0] === 'is not unique.') {
          const dupedId = findDuplicateInResponses(responses, body.entry.title)
          console.error(`\r[ ${contentUid}: ${entry.id} ]: `, response.errors, 'mapped to original: ', dupedId)
          responses[entry.id] = responses[dupedId]
        } else {
          console.error(`\r[ ${contentUid}: ${entry.id} ]: `, response.errors)
        }
      } else {
        await apiDelay()
        await publishEntry(context, contentUid, response.entry, entry)
        responses[entry.id] = createCacheEntry(response, entry)
      }
    }
  }
  return responses
}

export const getAssets = async (context, folderUid, skip = 0, limit = 100) => {
  await apiDelay(200)
  const res = await fetch(`${context.base_url}/assets?include_folders=true&folder=${folderUid}&include_count=true&skip=${skip}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...context.headers
    }
  })
  const response = await res.json()
  return response
}

export const getAllAssets = async (context, folderUid) => {
  let allAssets = []
  let remainingRecords = 1 // ensure it attempts it first time ( != 0 )
  let skip = 0;
  let limit = 100;
  while (remainingRecords > 0) { // ContentStack is paginated to max 100 records
    const response = await getAssets(context, folderUid, skip, limit)
    remainingRecords = response.assets.length
    skip += limit;
    allAssets = [...allAssets, ...response.assets]
  }
  return allAssets;
}


export const getEntries = async (context, contentUid, skip = 0, limit = 100) => {
  await apiDelay()
  const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries?include_count=true&skip=${skip}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...context.headers
    }
  })
  const response = await res.json()
  return response
}

export const getEntry = async (context, contentUid, uid) => {
  await apiDelay()
  const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries/${uid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...context.headers
    }
  })
  const response = await res.json()
  return response
}

export const getAllEntries = async (context, contentUid) => {
  let allEntries: any[] = [];
  let remainingRecords = 1 // ensure it attempts it first time ( != 0 )
  let skip = 0;
  let limit = 100;
  while (remainingRecords > 0) { // ContentStack is paginated to max 100 records
    const response = await getEntries(context, contentUid, skip, limit)
    remainingRecords = response.entries.length;
    skip += limit;
    allEntries = [...allEntries, ...response.entries]
  }
  return allEntries
}


export const removeAssetsWithSubFolders = async (context, folder, assets, recordsRemoved = 0) => {
  const responses = []
  for (const asset of assets) {
    process.stdout.write(`Removing assets: [ ${folder} ] ${recordsRemoved + responses.length} ${' '.repeat(35)}\r`)
    await apiDelay(100)
    const res = await fetch(`${context.base_url}/assets${asset.is_dir ? '/folders' : ''}/${asset.uid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...context.headers
      },
    })
    const response = await res.json()
    responses.push(response)
  }
  return responses
}

export const removeEntries = async (context, contentUid, entries, recordsRemoved = 0) => {
  const responses = []
  for (const entry of entries) {
    process.stdout.write(`Removing entries: [ ${contentUid} ] ${recordsRemoved + responses.length} ${' '.repeat(35)} \r`)
    await apiDelay(50)
    const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries/${entry.uid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...context.headers
      },
    })
    const response = await res.json()
    responses.push(response)
  }
  return responses
}

export const snakeCase = (str) => {
  return str?.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('_');
}

export const camelCase = (str) => {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
}

const findDuplicateInResponses = (responses, title) => {
  return Object.keys(responses).reduce((foundId, key) => {
    if (foundId) return foundId
    if (responses[key]?.title === title) {
      return key
    }
    return null
  }, null)
}

export default {
  camelCase,
  createEntries,
  getEntries,
  removeEntries,
  snakeCase
}
