import 'cross-fetch/polyfill'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from './config/envConfig'
import { getDataCache, writeSync } from './dataHandler/fileCache'
import { camelCase, getAssets, getEntries, getFolderUid, removeAssetsWithSubFolders, removeEntries, snakeCase } from './tools'
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
    writeSync(env, 'dataCache', camelCase(contentUid), {})
  }
}

const assetsToRemove = migrationConfiguration.filter((migration) => {
  return migration.includeInRemove && migration.type === 'asset'
})

const removeAssets = async (context) => {
  for (const migrationConfig of assetsToRemove) {
    const folder = migrationConfig.folderName
    const folderUid = getFolderUid(context.env, folder);
    if (!folderUid) {
      console.error(`Could not find a folder uid for ${folder}. Aborting asset fetch!!`)
      continue;
    }
    let recordsRemoved = await removeAssetsByFolder(context, migrationConfig, folder, folderUid, migrationConfig.removalTags);
    writeSync(context.env, 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])
    console.log(`removedAssets -> [ ${folder} ]`, recordsRemoved)
  }
}

const removeItemFromCache = (context, migrationConfig, item) => {
  const cacheKeys = Object.keys(context.cache[migrationConfig.name]);
  for (const id of cacheKeys) {
    if (context.cache[migrationConfig.name][id].uid === item.uid) {
      delete context.cache[migrationConfig.name][id];
      break;
    }
  }
};

const itemHasAllTags = (itemTags, tags = []) => {
  const hasAllTags =  tags.reduce((hasAllTags, currTag) => {
    if (!hasAllTags) return hasAllTags;
    return itemTags.includes(currTag);
  }, true);
  return hasAllTags
};

const removeAssetsByFolder = async (context, migrationConfig, folder, folderUid, removalTags) => {
  let remainingRecordCount = 1 // ensure it attempts it first time ( != 0 )
  let recordsRemoved = 0
  while (remainingRecordCount > 0) { // ContentStack is paginated to max 100 records
    const response = await getAssets(context, folderUid)
    remainingRecordCount = response.count
    if (!removalTags?.length) {
      const removedAssets = await removeAssetsWithSubFolders(context, folder, response.assets, recordsRemoved);
      context.cache[migrationConfig.name] = {};
      recordsRemoved += removedAssets.length;
    } else {
      for (const asset of response.assets) {
        if (itemHasAllTags(asset.tags, removalTags)) {
          const removeAssetResponse = await removeAssetsWithSubFolders(context, folder, [asset], recordsRemoved);
          if (removeAssetResponse?.[0].notice === 'Asset deleted successfully.') {
            recordsRemoved += 1;
            removeItemFromCache(context, migrationConfig, asset)
          }
        } else {
          recordsRemoved += await removeAssetsByFolder(context, migrationConfig, asset.name, asset.uid, removalTags);
        }
        remainingRecordCount -= 1;
      }
    }
  }
  return recordsRemoved;
};

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
  context.cache = getDataCache(env, migrationConfiguration.map((m) => m.name));
  await removeAssets(context)
  await removeContent(context)
  process.exit()
}

export default removeData
