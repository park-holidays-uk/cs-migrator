import 'cross-fetch/polyfill';
import dotenv from 'dotenv';
import {
  getEnvironmentVariables,
  migrationConfiguration
} from './config/envConfig';
import { getDataCache, writeSync } from './dataHandler/fileCache';
import { camelCase, getAllEntries, getAssets, getFolderUid, itemHasAllTags, removeAssetsWithSubFolders, removeEntries, snakeCase } from './tools';
import loginForAuthToken from './tools/login';
import { EnvironmentType } from './types';
dotenv.config();


const env = process.argv[2] as EnvironmentType

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const contentToRemove = migrationConfiguration.filter((migration) => {
  return migration.includeInRemove && migration.type === 'entry'
})

const removeContent = async (context) => {
  for (const migrationConfig of contentToRemove) {
		console.log('TCL: removeContent -> migrationConfig', migrationConfig)
    const contentUid = snakeCase(migrationConfig.name)
    const entries = await getAllEntries(context, contentUid)
		console.log('TCL: removeContent -> entries', JSON.stringify(entries))
    const removedEntries = await removeEntries(context, contentUid, entries, migrationConfig.removalTags)
    console.log(`removedEntries -> [ ${contentUid} ]`, removedEntries.length)
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
		console.log('TCL: removeAssets -> folderUid', folderUid)
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

const removeAssetsByFolder = async (context, migrationConfig, folder, folderUid, removalTags) => {
  let remainingRecords = 1 // ensure it attempts it first time ( != 0 )
  let recordsRemoved = 0
  let scannedAssets = 0
  let skip = 0, limit = 100;
  while (remainingRecords > 0) { // ContentStack is paginated to max 100 records
    const response = await getAssets(context, folderUid, skip, limit)
    const assets = response.assets || [];
    remainingRecords = assets.length;
    skip += limit;
    if (!removalTags?.length) {
      const removedAssets = await removeAssetsWithSubFolders(context, folder, assets, recordsRemoved);
      recordsRemoved = removedAssets.length;
      context.cache[migrationConfig.name] = {};
      remainingRecords = 0;
    } else {
      for (const asset of assets) {
        scannedAssets += 1;
        process.stdout.write(`Scanning asset tags: [ ${folder} ] : ${asset.id || asset.uid} (${scannedAssets})  ${' '.repeat(35)} \r`)
				console.log('TCL: removeAssetsByFolder -> asset.uid', asset.uid, itemHasAllTags(asset.tags, removalTags), asset.tags)
        if (itemHasAllTags(asset.tags, removalTags)) {
          const removeAssetResponse = await removeAssetsWithSubFolders(context, folder, [asset], recordsRemoved);
          if (removeAssetResponse?.[0].notice === 'Asset deleted successfully.') {
            recordsRemoved += 1;
            removeItemFromCache(context, migrationConfig, asset)
          }
        } else {
          recordsRemoved += await removeAssetsByFolder(context, migrationConfig, asset.name, asset.uid, removalTags);
        }
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
