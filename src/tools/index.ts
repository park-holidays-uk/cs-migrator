import fetch from 'node-fetch'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import request from 'request'
import dotenv from 'dotenv'
import { EnvironmentType, FolderNameType } from '../types'

dotenv.config()

export const apiDelay = (delay = 50) => new Promise((resolve) => setTimeout(resolve, delay)) // limit on contentstack api ('x' req/sec)

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

const publishAsset = async (context, assetUid) => {
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
  }
}

export const uploadAssets = async (context, assets, folderName, folderUid, createCacheEntry) => {
  if (!folderUid) {
    console.error('Could not find a folder uid. Aborting asset upload!')
    return
  }
  emptyAssetTmpDir()
  const responses = {}
  for (const asset of assets) {
    const recordCount = Object.keys(responses).length + 1
    process.stdout.write(`Uploading assets: [ ${folderName} ] ${recordCount} \r`)
    await apiDelay()
    const headers = {
      ...context.headers,
      'authorization': context.management_token,
    }
    await createAssetLocally(asset.path)
    try {
      const formData = new FormData();
      formData.append('asset[upload]', fs.createReadStream(`${TMP_DIR}/${asset.path}`))
      formData.append('asset[parent_uid]', folderUid)
      formData.append('asset[description]', asset.description)
      const res = await fetch(`${context.base_url}/assets`, {
        method: 'POST',
        headers,
        body: formData
      })
      const response = await res.json()
      if (response['error_code']) {
        console.error(`\r[ ${asset.path} ]: `, response.errors)
      } else {
        await publishAsset(context, response.asset.uid)
        responses[asset.id] = createCacheEntry(asset, response)
      }
    } catch (error) {
      console.error("uploadAssets -> error", error)
    }
  }
  return responses
}

const publishEntry = async (context, contentUid, responseEntry, entry) => {
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

const findCachedEntry = (migrationConfig, context, entry) => {
  const entryId = entry.id || entry.uid
  if (context.cache[migrationConfig.name][entryId]) {
    return context.cache[migrationConfig.name][entryId].uid
  }
}

const removeUnwantedDataUsingKeyMap = (keyMap: {}, dataObj) => {
  return Object.keys(dataObj).reduce((acc, dataKey) => {
    const data = {...acc}
    if (!keyMap[dataKey]) return data
    if (typeof keyMap[dataKey] === 'object') {
      data[dataKey] = removeUnwantedDataUsingKeyMap(keyMap[dataKey], dataObj[dataKey])
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
      console.log('none')
      responses[entry.id] = context.cache[migrationConfig.name][entry.id]
    } else {
      await apiDelay()
      let body = await createBody(entry)
      let method = 'POST'
      let url = `${context.base_url}/content_types/${contentUid}/entries`
      if (existingEntryUid) {
        url += `/${existingEntryUid}`
        method = 'PUT'
        if (migrationConfig.updateKeys !== 'all') {
          body = removeUnwantedDataUsingKeyMap(migrationConfig.updateKeys, body)
        }
        body.entry.uid = existingEntryUid
      }
      url += '?locale=en-gb'
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
        await publishEntry(context, contentUid, response.entry, entry)
        responses[entry.id] = createCacheEntry(response, entry)
      }
    }
  }
  return responses
}

export const getAssets = async (context, folder) => {
  const folderUid = getFolderUid(context.env, folder)
  if (!folderUid) {
    console.error(`Could not find a folder uid for ${folder}. Aborting asset fetch!!`)
    return []
  }
  await apiDelay()
  const res = await fetch(`${context.base_url}/assets?include_folders=true&folder=${folderUid}&include_count=true`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...context.headers
    }
  })
  const response = await res.json()
  return response
}

export const getEntries = async (context, contentUid) => {
  await apiDelay()
  const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries?include_count=true`, {
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
	console.log("TCL: getAllEntries -> contentUid", contentUid)
  let allEntries = []
  let totalRecordCount = 1 // ensure it attempts it first time ( != 0 )
  while (totalRecordCount > allEntries.length) { // ContentStack is paginated to max 100 records
    const response = await getEntries(context, contentUid)
		console.log("TCL: getAllEntries -> response", response.entries.length, response.count)
    totalRecordCount = response.count
    allEntries = [...allEntries, ...response.entries]
  }
  return allEntries
}


export const removeAssetsWithSubFolders = async (context, folder, assets, recordsRemoved = 0) => {
  const responses = []
  for (const asset of assets) {
    process.stdout.write(`Removing assets: [ ${folder} ] ${recordsRemoved + responses.length} \r`)
    await apiDelay()
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
    process.stdout.write(`Removing entries: [ ${contentUid} ] ${recordsRemoved + responses.length} \r`)
    await apiDelay()
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
