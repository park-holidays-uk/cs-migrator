import 'cross-fetch/polyfill'
import { camelCase, snakeCase } from './tools'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from './config/envConfig'
import { writeDataSync } from './dataHandler/fileCache'
import { getAssets, getEntries, removeEntries, removeAssetsWithSubFolders } from './tools'
import loginForAuthToken from './tools/login'
import { EnvironmentType } from './types'

const env = process.argv[2] as EnvironmentType

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const contentToRemove = migrationConfiguration.filter((migration) => {
  return migration.includeInRemove && migration.type === 'entry'
})

const removeContent = async (context) => {
  const contentUids = contentToRemove.map((item) => snakeCase(item.name))
  for (const contentUid of contentUids) {
    let remainingRecordCount = 1 // ensure it attempts it first time ( != 0 )
    let recordsRemoved = 0
    while (remainingRecordCount > 0) { // ContentStack is paginated to max 100 records
      const response = await getEntries(context, contentUid)
      remainingRecordCount = response.count
      const removedEntries = await removeEntries(context, contentUid, response.entries, recordsRemoved)
      recordsRemoved += removedEntries.length
    }
    console.log(`removedEntries -> [ ${contentUid} ]`, recordsRemoved)
    writeDataSync(env, camelCase(contentUid), {})
  }
}

const assetsToRemove = migrationConfiguration.filter((migration) => {
  return migration.includeInRemove && migration.type === 'asset'
})

const removeAssetsByFolder = async (context) => {
  for (const migrationConfig of assetsToRemove) {
    const folder = migrationConfig.folderName
    let remainingRecordCount = 1 // ensure it attempts it first time ( != 0 )
    let recordsRemoved = 0
    while (remainingRecordCount > 0) { // ContentStack is paginated to max 100 records
      const response = await getAssets(context, folder)
      remainingRecordCount = response.count
      const removedAssets = await removeAssetsWithSubFolders(context, folder, response.assets, recordsRemoved)
      recordsRemoved += removedAssets.length
    }
    writeDataSync(context.env, migrationConfig.name, {})
    console.log(`removedAssets -> [ ${folder} ]`, recordsRemoved)
  }
}

const removeData = async () => {
  console.log('\n\n Build Complete!! Starting removal... \n\n\n')
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
  context.env = env
  await removeAssetsByFolder(context)
  await removeContent(context)
  process.exit()
}

export default removeData
