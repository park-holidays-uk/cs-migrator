import dotenv from 'dotenv';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import request from 'request';
import { createHeaders, getPublishEnvironments } from '../config';
import { CachedEntries, CacheEntry, CreateBody, CSReference, EntryObj, EntryPayload, TargetStackName } from '../types';
import {
  EnvironmentType,
  FolderNameType,
  MigrationConfigurationType,
  ScraperCtx,
  StackName,
} from '../types';
import { findChildStackUids } from './childstack';

dotenv.config();

// TCL: delay needs to be above 1500 to publish reliably - reduce for testing
export const apiDelay = (delay = 1500) => new Promise((resolve) => setTimeout(resolve, delay)); // limit on contentstack api ('x' req/sec)

export const getFolderUid = (env: EnvironmentType, folder: FolderNameType) => {
  return process.env[`${env}_${folder}`];
};
const TMP_DIR = path.resolve(__dirname, '../tmp');

const createAssetLocally = (assetName) =>
  new Promise(async (resolve) => {
    const writeStream = fs.createWriteStream(`${TMP_DIR}/${assetName}`);
    await request(`https://assets.parkholidays.com/assets/${assetName}`).pipe(writeStream);
    writeStream.on('finish', resolve);
  });

const emptyAssetTmpDir = () => {
  fs.readdirSync(TMP_DIR).forEach(function (file, index) {
    fs.unlinkSync(`${TMP_DIR}/${file}`);
  });
};



export const createImageFolders = async (context, folder, subFolder, migrationConfig) => {
  const subFolderName = subFolder.replace('&', 'and');
  const foldersExist = Object.keys(context.cache[migrationConfig.name]).find((key) => {
    return context.cache[migrationConfig.name][key].folder === `${folder}/${subFolderName}/images`;
  });
  if (foldersExist) {
    return context.cache[migrationConfig.name][foldersExist].folderUids;
  }
  const folderUid = getFolderUid(context.env, folder);
  if (!folderUid) {
    console.error('Could not find a folder lookup. Aborting folder creation!');
    return;
  }
  const headers = {
    'Content-Type': 'application/json',
    ...context.headers,
    authorization: context.management_token,
  };
  const subRes = await fetch(`${context.base_url}/assets/folders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset: {
        name: subFolderName,
        parent_uid: folderUid,
      },
    }),
  });
  const subFolderResponse = await subRes.json();
  const imgRes = await fetch(`${context.base_url}/assets/folders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset: {
        name: 'Images',
        parent_uid: subFolderResponse.asset.uid,
      },
    }),
  });
  const vidRes = await fetch(`${context.base_url}/assets/folders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset: {
        name: 'Videos',
        parent_uid: subFolderResponse.asset.uid,
      },
    }),
  });
  const imageResponse = await imgRes.json();
  const videoResponse = await vidRes.json();
  return {
    imageFolderUid: imageResponse.asset.uid,
    videoFolderUid: videoResponse.asset.uid,
  };
};

export const publishAsset = async (context, assetUid) => {
  try {
    const res = await fetch(`${context.base_url}/assets/${assetUid}/publish`, {
      method: 'POST',
      headers: {
        ...context.headers,
        authorization: context.management_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: {
          locales: ['en-gb'],
          environments: JSON.parse(process.env[`${context.env}_environments`]), // i.e. production / qa / preview
        },
        version: 1,
        scheduled_at: '2019-02-08T18:30:00.000Z',
      }),
    });
  } catch (err) {
    console.error('publishAsset -> err', err);
    throw new Error(err);
  }
};

export const uploadAssets = async (
  context,
  assets,
  folderName,
  folderUid,
  tags,
  createCacheEntry,
) => {
  if (!folderUid) {
    console.error('Could not find a folder uid. Aborting asset upload!');
    return;
  }
  emptyAssetTmpDir();
  const responses = {};
  for (const asset of assets) {
    const recordCount = Object.keys(responses).length + 1;
    process.stdout.write(`Uploading assets: [ ${folderName} ] ${recordCount} ${' '.repeat(25)}\r`);
    await apiDelay();
    const headers = {
      ...context.headers,
      authorization: context.management_token,
    };
    await createAssetLocally(asset.path);
    try {
      const formData = new FormData();
      formData.append('asset[upload]', fs.createReadStream(`${TMP_DIR}/${asset.path}`));
      formData.append('asset[parent_uid]', folderUid);
      formData.append('asset[description]', asset.description);
      formData.append('asset[tags]', tags.join(','));
      const res = await fetch(`${context.base_url}/assets`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const response = await res.json();
      if (response['error_code']) {
        console.error(`\r[ ${asset.path} ]: `, response.errors);
      } else {
        await publishAsset(context, response.asset.uid);
        responses[asset.id] = createCacheEntry(asset, response);
      }
    } catch (error) {
      console.error('uploadAssets -> error', error);
      throw new Error(error);
    }
  }
  return responses;
};

export const publishEntry = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
  contentUid: string,
  responseEntry: EntryObj,
  entry: EntryObj,
) => {
  try {
    const environments = getPublishEnvironments(context, migrationConfig);
    if (!environments.length) {
      console.error('No Publishing Environments configured. Did not publish anything!');
      return;
    }
    const res = await fetch(`${context.CS_BASE_URL}/bulk/publish?x-bulk-action=publish`, {
      method: 'POST',
      headers: createHeaders(context, migrationConfig.stackName),
      body: JSON.stringify({
        entries: [
          {
            uid: responseEntry.uid,
            content_type: contentUid,
            version: 1,
            locale: 'en-gb',
          },
        ],
        locales: ['en-gb'],
        environments,
        publish_with_reference: true,
        skip_workflow_stage_check: true,
      }),
    });
    const publishEntryResponse = await res.json();
    if (publishEntryResponse.errors) {
      console.error('\npublishEntry -> error: ', publishEntryResponse, 'contentUid', contentUid);
      console.error('responseEntry -> ', responseEntry, 'entry', entry);
    }
  } catch (err) {
    console.error('publishEntry -> err', err);
  }
};

export const arrayToKeyedObject = (arr, key = 'uid') =>
  arr.reduce((obj, item) => {
    obj[item[key]] = item;
    return obj;
  }, {});

export const findCachedEntry = (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
  legacyEntryUid: string = 'not_a_uid',
  targetStack?: StackName,
  cacheName?: string,
): [CacheEntry, string] | [] => {
  const cacheKey = cacheName ?? migrationConfig.name;
  const entry = context.cache[cacheKey]?.[legacyEntryUid];
  if (entry) {
    const targetUidKey = targetStack ? `${targetStack}_uid` : `${migrationConfig.stackName}_uid`;
    const targetUid = entry[targetUidKey];
    return targetUid ? [entry, targetUid] : [];
  }
  return [];
};


export const switchStackReferences = (
  context: ScraperCtx,
  entry: EntryObj,
  stackName: TargetStackName,
): EntryObj => {

  const switchReferencesInEntry = (data: object): object => {
    const update = {};
    if (data === null) {
			console.log('TCL: data', data)
      return data;
    }
    if (typeof data === 'object' && data.hasOwnProperty('_content_type_uid')) {
      // @ts-expect-error - findCachedEntry is expecting a migrationConfig object but being forced here with stackName and contentType.
      const [_cachedEntry, uid] = findCachedEntry(context, {}, data.uid, stackName, camelCase(data['_content_type_uid']))
      if (uid) {
        return {
          uid,
          _content_type_uid: data['_content_type_uid'],
        };
      }
      return data;
    }
    const keys = Object.keys(data);
    for (const key of keys) {
      if (typeof data[key] === 'object') {
        if (Array.isArray(data[key])) {
          update[key] = [];
          for (const item of data[key]) {
            if (typeof item === 'object') {
              update[key].push(switchReferencesInEntry(item))
            } else {
              update[key].push(item)
            }
          }
        } else {
          update[key] = switchReferencesInEntry(data[key]);
        }
      } else {
        update[key] = data[key];
      }
    }
    return update;
  };
  //@ts-expect-error - object/EntryObj
  return switchReferencesInEntry(entry);
};

// export const switchStackReferences = (
//   context: ScraperCtx,
//   references: CSReference[],
//   cacheName: string,
//   stackName: TargetStackName,
// ): CSReference[] => {
//   //@ts-expect-error - TS does not understand filter(Boolean)
//   return references.map<CSReference>((legeacyRef) => {
//     const entry = context.cache[cacheName]?.[legeacyRef.uid];
//     if (entry && entry[`${stackName}_uid`]) {
//       return {
//         uid: entry[`${stackName}_uid`],
//         _content_type_uid: legeacyRef._content_type_uid,
//       }
//     }
//   }).filter(Boolean);
// }

// const findReferenceInCache = (
//   context: ScraperCtx,
//   migrationConfig: MigrationConfigurationType,
//   legacyEntryUid: string = 'not_a_uid',
//   targetStack?: StackName,
//   cacheName?: string,
//   ) => {
// 	console.log('TCL: legacyEntryUid', legacyEntryUid)
//   const cachedEntry = findCachedEntry(context, migrationConfig, legacyEntryUid, targetStack, cacheName)
// 	console.log('TCL: cachedEntry', JSON.stringify(cachedEntry))
//   if (data) {
//     return [
//       {
//         uid: data.uid,
//         _content_type_uid: contentUid,
//       },
//     ];
//   }
// };

// export const findCachedEntryFromUid = (context, cacheRef, entry) => {
//   const cache = context.cache[cacheRef];
//   const response = Object.keys(cache).reduce<{ uid: string; id: string } | null>(
//     (foundItem, id) => {
//       if (!foundItem && cache[id].uid === entry.uid) {
//         foundItem = {
//           ...cache[id],
//           id,
//         };
//       }
//       return foundItem;
//     },
//     null,
//   );
//   return response;
// };

const blacklistKeys = {
  created_at: true,
  updated_at: true,
  created_by: true,
  // season_start_date: true,
  // season_end_date: true,
  updated_by: true,
  is_dir: true,
  _version: true,
  _metadata: true,
  content_type: true,
  ACL: true,
  _in_progress: true,
  locale: true,
};

export const scrubExistingData = <T>(
  existingData: T,
  extendedBlacklistKeys: { [key: string]: boolean } = {},
): T => {
  // Removes unwanted key/values for writing to contentstack
  const allBlacklistedKeys = { ...blacklistKeys, ...extendedBlacklistKeys };
  const data = { ...(existingData ?? {}) } as any;
  return Object.keys(data).reduce((acc, key) => {
    const formatted = { ...acc };
    /* if (key === 'image' && data['image']?.uid) {
      formatted['image'] = data[key].uid;
    } else */ if (data[key]?.filename && data[key]?.uid) {
      // This is an asset - just return uid
      formatted[key] = data[key].uid;
    } else if (!allBlacklistedKeys[key]) {
      if (typeof data[key] === 'object') {
        if (Array.isArray(data[key])) {
          formatted[key] = data[key].map((item) =>
            typeof item === 'object' ? scrubExistingData(item, extendedBlacklistKeys) : item,
          );
        } else {
          formatted[key] = scrubExistingData(data[key], extendedBlacklistKeys);
        }
      } else {
        formatted[key] = data[key];
      }
    }
    return formatted;
  }, {} as T);
};

const removeUnwantedDataUsingKeyMap = (keyMap: {}, dataObj, existingData): EntryPayload => {
  return Object.keys(dataObj).reduce((acc, dataKey) => {
    const data = { ...acc };
    if (!keyMap[dataKey]) {
      return {
        ...data,
        [dataKey]: existingData[dataKey],
      };
    }
    if (typeof keyMap[dataKey] === 'object') {
      if (Array.isArray(keyMap[dataKey])) {
        data[dataKey] = dataObj[dataKey].reduce(
          (acc, curr, index) => [
            ...acc,
            removeUnwantedDataUsingKeyMap(keyMap[dataKey][0], curr, existingData[dataKey][index]),
          ],
          [],
        );
      } else {
        data[dataKey] = removeUnwantedDataUsingKeyMap(
          keyMap[dataKey],
          dataObj[dataKey],
          existingData[dataKey],
        );
      }
    } else {
      data[dataKey] = dataObj[dataKey];
    }
    return data;
  }, {} as EntryPayload);
};

const skipUpdate = (
  migrationConfig: MigrationConfigurationType,
  entry: EntryObj,
  existingEntry?: CacheEntry,
) => {
  if (existingEntry && migrationConfig.updateKeys === 'none') return true;
  if (migrationConfig.shouldCheckUpdatedAt && existingEntry?.updated_at === entry.updated_at) {
    return true;
  }
  return false;
};

export const createEntries = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
  contentUid: string,
  entries: EntryObj[],
  createBody: CreateBody,
  createCacheEntry: (uids: CacheEntry) => CacheEntry,
): Promise<CachedEntries> => {
  const responses = {};
  for (const entry of entries) {
    if (!entry.uid) return {};
    const recordCount = Object.keys(responses).length + 1;
    process.stdout.write(`Creating entries: [ ${contentUid} ] ${recordCount} \r`);
    const [ existingEntry, existingEntryUid] = findCachedEntry(context, migrationConfig, entry.uid);
    if (skipUpdate(migrationConfig, entry, existingEntry)) {
			console.log('TCL: skipUpdate SKIP SKIP', JSON.stringify(existingEntry))
      responses[entry.uid] = context.cache[migrationConfig.name][entry.uid];
    } else {
      await apiDelay(5000); // Needs a long delay to allow child stacks to catch up
      let body = await createBody(entry);
			console.log('TCL: body', JSON.stringify(body))
      if (body.entry === null) continue;
      body = scrubExistingData(body, migrationConfig.scrubbedFields);
      let method = 'POST';
      let url = `${context.CS_BASE_URL}/content_types/${contentUid}/entries`;
      if (existingEntryUid) {
        url += `/${existingEntryUid}`;
        method = 'PUT';
        if (migrationConfig.updateKeys !== 'all') {
          body = removeUnwantedDataUsingKeyMap(migrationConfig.updateKeys, body, body);
        }
        //@ts-expect-error body.entry is possibly null
        body.entry.uid = existingEntryUid;
      }
      console.log('TCL: body', JSON.stringify(body))
      url += '?locale=en-gb';
      const res = await fetch(url, {
        method,
        headers: createHeaders(context, migrationConfig.stackName),
        body: JSON.stringify(body),
      });
      const response = await res.json();
      if (response['error_code']) {
        if (
          response['error_code'] === 119 &&
          response.errors?.title &&
          response.errors.title[0] === 'is not unique.'
        ) {
          const dupedId = findDuplicateInResponses(responses, body.entry.title);
          console.error(
            `\r[ ${contentUid}: ${entry.uid} ]: `,
            response.errors,
            'mapped to original: ',
            dupedId,
          );
          responses[entry.uid] = responses[dupedId];
        } else {
          console.error(`\r[ ${contentUid}: ${entry.uid} ]: `, response.errors);
        }
      } else {
        await apiDelay(500);
        await publishEntry(context, migrationConfig, contentUid, response.entry, entry);
        let childUids = {};
        if (migrationConfig.stackName === 'global') {
          childUids = await findChildStackUids(context, contentUid, response.entry);
        }
        responses[entry.uid] = createCacheEntry({
          legacy_uid: entry.uid,
          legacy_updated_at: entry.updated_at ?? '',
          [`${migrationConfig.stackName}_uid`]: response.entry.uid,
          [`${migrationConfig.stackName}_updated_at`]: response.entry.updated_at,
          ...childUids,
        });
      }
    }
    break;
  }
  return responses;
};

export const getAssets = async (context, folderUid, skip = 0, limit = 100) => {
  await apiDelay();
  const res = await fetch(
    `${context.base_url}/assets?include_folders=true&folder=${folderUid}&include_count=true&skip=${skip}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...context.headers,
      },
    },
  );
  const response = await res.json();
  return response;
};

export const getAllAssets = async (context, contentUid) => {
  let allAssets = [];
  let remainingRecords = 1; // ensure it attempts it first time ( != 0 )
  let skip = 0;
  let limit = 100;
  while (remainingRecords > 0) {
    // ContentStack is paginated to max 100 records
    const response = await getAssets(context, contentUid, skip, limit);
    remainingRecords = response.assets.length;
    skip += limit;
    allAssets = [...allAssets, ...response.assets];
  }
  return allAssets;
};

export const getEntries = async (
  context: ScraperCtx,
  stackName: StackName,
  contentUid: string,
  skip: number = 0,
  limit: number = 100,
) => {
  await apiDelay();
  const res = await fetch(
    `${context.CS_BASE_URL}/content_types/${contentUid}/entries?include_count=true&skip=${skip}&limit=${limit}`,
    {
      method: 'GET',
      headers: createHeaders(context, stackName),
    },
  );
  const response = await res.json();
  return response;
};

export const getEntry = async (
  context: ScraperCtx,
  stackName: StackName,
  contentUid: string,
  uid: string,
) => {
  await apiDelay();
  const res = await fetch(`${context.CS_BASE_URL}/content_types/${contentUid}/entries/${uid}`, {
    method: 'GET',
    headers: createHeaders(context, stackName),
  });
  const response = await res.json();
  return response;
};

export const getAllEntries = async (
  context: ScraperCtx,
  stackName: StackName,
  contentUid: string,
): Promise<EntryObj[]> => {
  let allEntries: EntryObj[] = [];
  let remainingRecords = 1; // ensure it attempts it first time ( != 0 )
  let skip = 0;
  let limit = 100;
  while (remainingRecords > 0) {
    // ContentStack is paginated to max 100 records
    const response = await getEntries(context, stackName, contentUid, skip, limit);
    remainingRecords = response.entries.length;
    skip += limit;
    allEntries = [...allEntries, ...response.entries];
  }
  return allEntries;
};

export const removeAssetsWithSubFolders = async (context, folder, assets, recordsRemoved = 0) => {
  const responses = [];
  for (const asset of assets) {
    process.stdout.write(
      `Removing assets: [ ${folder} ] ${recordsRemoved + responses.length} ${' '.repeat(35)}\r`,
    );
    await apiDelay();
    const res = await fetch(
      `${context.base_url}/assets${asset.is_dir ? '/folders' : ''}/${asset.uid}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...context.headers,
        },
      },
    );
    const response = await res.json();
    responses.push(response);
  }
  return responses;
};

export const removeEntries = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
  contentUid: string,
  entries: EntryObj[],
): Promise<string[]> => {
  const deletedUids: string[] = [];
  for (const entry of entries) {
    if (!entry.uid) continue;
    process.stdout.write(
      `Removing entries: [ ${contentUid} ] ${deletedUids.length} ${' '.repeat(
        35,
      )} \r`,
    );
    await apiDelay(50);

    const res = await fetch(
      `${context.CS_BASE_URL}/content_types/${contentUid}/entries/${entry.uid}`,
      {
        method: 'DELETE',
        headers: createHeaders(context, migrationConfig.stackName),
      },
    );
    const response = await res.json();
    if (response.notice === 'Entry deleted successfully.') {
      deletedUids.push(entry.uid);
    }
  }
  return deletedUids;
};

export const snakeCase = (str) => {
  return str
    ?.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.toLowerCase())
    .join('_');
};

export const camelCase = (str) => {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

const findDuplicateInResponses = (responses, title) => {
  return Object.keys(responses).reduce((foundId, key) => {
    if (foundId) return foundId;
    if (responses[key]?.title === title) {
      return key;
    }
    return null;
  }, null);
};

export default {
  camelCase,
  createEntries,
  getEntries,
  removeEntries,
  snakeCase,
};
