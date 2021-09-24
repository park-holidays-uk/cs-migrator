import fetch from 'node-fetch'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import request from 'request'
import dotenv from 'dotenv'

dotenv.config()

export const apiDelay = (delay = 50) => new Promise((resolve) => setTimeout(resolve, delay)) // limit on contentstack api ('x' req/sec)

export const folderLookup = {
  'Park_Logo': process.env['Park_Logo'],
  'Location_Media': process.env['Location_Media'],
  'Accommodation_Media': process.env['Accommodation_Media'],
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

export const createImageFolders = async (context, folder, subFolderName) => {
  if (!folderLookup[folder]) {
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
        name: subFolderName.replace('&', 'and'),
        'parent_uid': folderLookup[folder]
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
          "environments": JSON.parse(process.env.environments) // i.e. production / qa / preview
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

const publishEntry = async (context, contentUid, entryUid) => {
  try {
    const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries/${entryUid}/publish`, {
      method: 'POST',
      headers: {
        ...context.headers,
        'authorization': context.management_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "entry": {
          "locales": ["en-gb"],
          "environments": [
            "blt768ff34d9f82b006", //production
            "blt242187e2891f7339", //qa
            "blt3d97399c6e83ae0b" //preview
          ]
        },
        "version": 1,
        "scheduled_at": "2019-02-08T18:30:00.000Z"
      })
    })
  } catch(err) {
	  console.error("publishEntry -> err", err)

  }
}

export const createEntries = async (context, contentUid, entries, createBody, createCacheEntry) => {
  const responses = {}
  for (const entry of entries) {
    const recordCount = Object.keys(responses).length + 1
    process.stdout.write(`Creating entries: [ ${contentUid} ] ${recordCount} \r`)
    await apiDelay()
    const body = await createBody(entry)
    const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries?locale=en-gb`, {
      method: 'POST',
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
      await publishEntry(context, contentUid, response.entry.uid)
      responses[entry.id] = createCacheEntry(response, entry)
    }
  }
  return responses
}

export const getAssets = async (context, folder) => {
  if (!folderLookup[folder]) {
    console.error('Could not find a folder lookup. Aborting asset fetch!!')
    return []
  }
  await apiDelay()
  const res = await fetch(`${context.base_url}/assets?include_folders=true&folder=${folderLookup[folder]}&include_count=true`, {
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
  createEntries,
  getEntries,
  removeEntries,
  snakeCase
}
