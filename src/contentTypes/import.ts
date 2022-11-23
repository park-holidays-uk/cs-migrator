import 'cross-fetch/polyfill'
import pluralize from 'pluralize'
import { getEnvironmentVariables } from '../config/envConfig'
import { EnvironmentType, ContentTypeType, MigrationType } from '../types'
import { readSync } from '../dataHandler/fileCache'
import { apiDelay, arrayToKeyedObject } from '../tools'
import { createApiCredentials } from '../tools/login'

const env = process.argv[2] as EnvironmentType
const filename = process.argv[4]

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

export const updateContentType = async (context, data, type: ContentTypeType, contentUid?: MigrationType) => {
  const contentUidUrl = contentUid ? `/${contentUid}` : ''
  const headers = {
    'Content-Type': 'application/json',
    ...context.headers
  }
  const res = await fetch(`${context.base_url}/${type}${contentUidUrl}`, {
    method: 'GET',
    headers
  })
  const response = await res.json()
  const existingFields = arrayToKeyedObject(contentUid ? [ response[pluralize.singular(type)] ] : response[type], 'uid')
  const dataToIterate = Array.isArray(data) ? data : [ data ]
  for (const item of dataToIterate) {
    let url = `${context.base_url}/${type}`
    let method = 'POST'
    const body = item
    if (existingFields[item.uid]) {
      url += `/${item.uid}`
      method = 'PUT'
      delete body.uid
    }
    await apiDelay()
    const updateRes = await fetch(url, {
      method,
      headers,
      body: JSON.stringify({ [pluralize.singular(type)]: {
        ...body
      }})
    })
    delete existingFields[item.uid]
  }
}

const importContentTypes = async () => {
  const context = await createApiCredentials({
    CS_BASE_URL: 'https://eu-api.contentstack.com/v3',
  })
  const { contentTypes, globalFields } = readSync(env, 'contentCache', filename)
  await updateContentType(context, globalFields, 'global_fields')
  await updateContentType(context, contentTypes, 'content_types')
}

export default importContentTypes