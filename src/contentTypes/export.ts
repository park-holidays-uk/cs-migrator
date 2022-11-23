import 'cross-fetch/polyfill'
import { createApiCredentials } from '../tools/login'
import { getEnvironmentVariables } from '../config/envConfig'
import { EnvironmentType, MigrationType, ContentTypeType } from '../types'
import { writeSync } from '../dataHandler/fileCache'



const env = process.argv[2] as EnvironmentType
const filename = process.argv[4]

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)


export const fetchContentType = async (context, type: ContentTypeType, contentUid?: MigrationType) => {
  const contentUidUrl = contentUid ? `/${contentUid}` : ''
  const res = await fetch(`${context.base_url}/${type}${contentUidUrl}`, {
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
  const context = await createApiCredentials({
    CS_BASE_URL: 'https://eu-api.contentstack.com/v3',
  })
  const globalFields = await fetchContentType(context, 'global_fields')
  const contentTypes = await fetchContentType(context, 'content_types')
  writeSync(env, 'contentCache', filename,  {
    contentTypes: contentTypes['content_types'],
    globalFields: globalFields['global_fields']
  })
}

export default exportContentTypes