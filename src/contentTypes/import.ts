import 'cross-fetch/polyfill'
import pluralize from 'pluralize'
import loginForAuthToken from '../tools/login'
import { getEnvironmentVariables } from '../config/envConfig'
import { EnvironmentType } from '../types'
import { readSync } from '../dataHandler/fileCache'
import { apiDelay } from '../tools'

const env = process.argv[2] as EnvironmentType
const filename = process.argv[4]

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const arrayToUidKeyedObject = (arr) => arr.reduce((obj, item) => {
  obj[item.uid] = item
  return obj
}, {})

export const updateContentType = async (context, data, contentType) => {
  const headers = {
    'Content-Type': 'application/json',
    ...context.headers
  }
  const res = await fetch(`${context.base_url}/${contentType}`, {
    method: 'GET',
    headers
  })
  const response = await res.json()
  const existingFields = arrayToUidKeyedObject(response[contentType])
  for (const item of data) {
    let url = `${context.base_url}/${contentType}`
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
      body: JSON.stringify({ [pluralize.singular(contentType)]: {
        ...body
      }})
    })
    delete existingFields[item.uid]
  }
}

const importContentTypes = async () => {
  const context = await loginForAuthToken({
    base_url,
    email,
    password: null,
    management_token,
    headers: {
      api_key,
      authtoken: null,
    }
  })
  const { contentTypes, globalFields } = readSync(env, 'contentCache', filename)
  await updateContentType(context, globalFields, 'global_fields')
  await updateContentType(context, contentTypes, 'content_types')
}

export default importContentTypes