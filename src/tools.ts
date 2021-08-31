import fetch from 'node-fetch'
import FormData from 'form-data'
import fs from 'fs'
import request from 'request'

export const apiDelay = (delay = 50) => new Promise((resolve) => setTimeout(resolve, delay)) // limit on contentstack api ('x' req/sec)

export const folderLookup = {
  'Park_Logo': 'bltee6ed710d6be4f60',
  'Location_Media': 'bltf2b21a385ea6c1cc',
  'Accommodation_Media': 'bltc9f8b05dab8bae86',
}
const TMP_DIR = `${__dirname}/tmp`

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
	console.log("TCL: subFolderResponse", subFolderResponse)
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
	console.log("TCL: imageResponse", imageResponse)
  const videoResponse = await vidRes.json()
	console.log("TCL: videoResponse", videoResponse)
  return {
    imageFolderUid: imageResponse.asset.uid,
    videoFolderUid: videoResponse.asset.uid
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
      const res = await fetch(`${context.base_url}/assets`, {
        method: 'POST',
        headers,
        body: formData
      })
      const response = await res.json()
      if (response['error_code']) {
        console.error(`\r[ ${asset.path} ]: `, response.errors)
      } else {
        responses[asset.id] = createCacheEntry(asset, response)
      }
    } catch (error) {
      console.error("uploadAssets -> error", error)
    }
  }
  return responses
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
      if (response['error_code'] === 119 && response.errors.title && response.errors.title[0] === 'is not unique.') {
        const dupedId = findDuplicateInResponses(responses, body.entry.title)
        console.error(`\r[ ${contentUid}: ${entry.id} ]: `, response.errors, 'mapped to original: ', dupedId)
				responses[entry.id] = responses[dupedId]
      } else {
        console.error(`\r[ ${contentUid}: ${entry.id} ]: `, response.errors)
      }
    } else {
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
    if (responses[key].title === title) {
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
