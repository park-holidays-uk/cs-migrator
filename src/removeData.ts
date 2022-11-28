import 'cross-fetch/polyfill';
import { getEnvironmentVariables, migrationConfiguration } from './config/envConfig';
import { getDataCache, writeSync } from './dataHandler/fileCache';
import {
  camelCase,
  getAllEntries,
  getAssets,
  getEntries,
  getFolderUid,
  removeAssetsWithSubFolders,
  removeEntries,
  snakeCase,
} from './tools';
import { createApiCredentials } from './tools/login';
import { EnvironmentType, ScraperCtx } from './types';

const env = process.argv[2] as EnvironmentType;

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env);

const removeContent = async (context: ScraperCtx) => {
  for (const migrationConfig of migrationConfiguration) {
    if (migrationConfig.type !== 'entry' || !migrationConfig.includeInRemove) continue;
    const contentUid = migrationConfig.contentUid ?? snakeCase(migrationConfig.name);
    console.log('TCL: contentUid to remove', contentUid);
    const entriesToRemove = await getAllEntries(context, migrationConfig.stackName, contentUid);
    const removedEntries = await removeEntries(
      context,
      migrationConfig,
      contentUid,
      entriesToRemove,
    );
    console.log(`removedEntries -> [ ${contentUid} ]`, removedEntries.length);
    writeSync('legacy', 'dataCache', migrationConfig.name, {});
  }
};

const assetsToRemove = migrationConfiguration.filter((migration) => {
  return migration.includeInRemove && migration.type === 'asset';
});

const removeAssets = async (context) => {
  // for (const migrationConfig of assetsToRemove) {
  //   const folder = migrationConfig.folderName
  //   const folderUid = getFolderUid(context.env, folder);
  //   if (!folderUid) {
  //     console.error(`Could not find a folder uid for ${folder}. Aborting asset fetch!!`)
  //     continue;
  //   }
  //   let recordsRemoved = await removeAssetsByFolder(context, migrationConfig, folder, folderUid, migrationConfig.removalTags);
  //   writeSync(context.env, 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])
  //   console.log(`removedAssets -> [ ${folder} ]`, recordsRemoved)
  // }
};

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
  const hasAllTags = tags.reduce((hasAllTags, currTag) => {
    if (!hasAllTags) return hasAllTags;
    return itemTags.includes(currTag);
  }, true);
  return hasAllTags;
};

const removeAssetsByFolder = async (context, migrationConfig, folder, folderUid, removalTags) => {
  let remainingRecords = 1; // ensure it attempts it first time ( != 0 )
  let recordsRemoved = 0;
  let scannedAssets = 0;
  let skip = 0,
    limit = 100;
  while (remainingRecords > 0) {
    // ContentStack is paginated to max 100 records
    const response = await getAssets(context, folderUid, skip, limit);
    const assets = response.assets || [];
    remainingRecords = assets.length;
    skip += limit;
    if (!removalTags?.length) {
      const removedAssets = await removeAssetsWithSubFolders(
        context,
        folder,
        assets,
        recordsRemoved,
      );
      recordsRemoved = removedAssets.length;
      context.cache[migrationConfig.name] = {};
      remainingRecords = 0;
    } else {
      for (const asset of assets) {
        scannedAssets += 1;
        process.stdout.write(
          `Scanning asset tags: [ ${folder} ] : ${
            asset.id || asset.uid
          } (${scannedAssets})  ${' '.repeat(35)} \r`,
        );
        if (itemHasAllTags(asset.tags, removalTags)) {
          const removeAssetResponse = await removeAssetsWithSubFolders(
            context,
            folder,
            [asset],
            recordsRemoved,
          );
          if (removeAssetResponse?.[0].notice === 'Asset deleted successfully.') {
            recordsRemoved += 1;
            removeItemFromCache(context, migrationConfig, asset);
          }
        } else {
          recordsRemoved += await removeAssetsByFolder(
            context,
            migrationConfig,
            asset.name,
            asset.uid,
            removalTags,
          );
        }
      }
    }
  }
  return recordsRemoved;
};

const removeData = async () => {
  console.log('\n\n Build Complete!! Starting removal... \n\n\n');
  const context = await createApiCredentials({
    CS_BASE_URL: 'https://eu-api.contentstack.com/v3',
  });
  context.env = env;
  context.cache = getDataCache(migrationConfiguration.map((m) => m.name));
  await removeAssets(context);
  await removeContent(context);
  process.exit();
};

export default removeData;
