import 'cross-fetch/polyfill'
import loginForAuthToken from '../tools/login'
import { getEnvironmentVariables } from '../config/envConfig'
import { EnvironmentType } from '../types'
import { writeContentSync } from '../dataHandler/fileCache'

const env = process.argv[2] as EnvironmentType
const filename = process.argv[4]

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const fetchContent = async (context, contentType) => {
  const res = await fetch(`${context.base_url}/${contentType}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...context.headers
    }
  })
  const response = await res.json()
  return response
}

const exportContentTypes = async () => {
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
  const globalFields = await fetchContent(context, 'global_fields')
  const contentTypes = await fetchContent(context, 'content_types')
  writeContentSync(env, filename,  {
    contentTypes: contentTypes['content_types'],
    globalFields: globalFields['global_fields']
  })
}

export default exportContentTypes