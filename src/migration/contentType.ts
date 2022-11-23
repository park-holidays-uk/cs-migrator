import 'cross-fetch/polyfill';
import { getDataCache, readSync, writeSync } from '../dataHandler/fileCache';
import { arrayToKeyedObject, createEntries, getAllEntries, snakeCase } from '../tools';
import { CachedEntries, EntryObj, EntryPayload, MigrationConfigurationType, ScraperCtx } from '../types';

const reportUpdatedEntries = (key, cachedEntries) => {
  console.log(
    `updatedEntries -> [ ${snakeCase(key)} ]`,
    Object.keys(cachedEntries).length,
    ' '.repeat(25),
  );
};

const mergeCache = (
  knownEntries: CachedEntries,
  mergeEntries: CachedEntries,
): CachedEntries => Object.keys(knownEntries).reduce(
  (acc, legacyUid) => {
    return {
      ...acc,
      [legacyUid]: {
        ...knownEntries[legacyUid],
        ...(mergeEntries[legacyUid] && { ...mergeEntries[legacyUid]})
      }
    };
  },
  {},
);


const migrateContentType = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const contentUid = migrationConfig.contentUid ?? snakeCase(migrationConfig.name);

  const legacyEntries = await getAllEntries(context, 'legacy', contentUid);
  console.log('TCL: legacyEntries 0000', JSON.stringify(legacyEntries));

	console.log('TCL: context.cache[migrationConfig.name] 1111', JSON.stringify(context.cache[migrationConfig.name]))
  // writeSync('legacy', 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])

  const legacyCache = arrayToKeyedObject(
    legacyEntries.map((entry) => ({
      legacyUid: entry.uid,
      updated_at: entry.updated_at,
    })),
    'legacyUid',
  );


	console.log('TCL: legacyCache 2222', JSON.stringify(legacyCache))

  context.cache[migrationConfig.name] = mergeCache(legacyCache, context.cache[migrationConfig.name]);
	console.log('TCL: context.cache[migrationConfig.name] 3333', JSON.stringify(context.cache[migrationConfig.name]))

  // // re-populate entries using new structure
  console.log('TCL: migrationConfig.name', migrationConfig.name);
  const childCacheEntries = await createEntries(
    context,
    migrationConfig,
    contentUid,
    legacyEntries,
    async (entry: EntryObj) => {
      const update = {
        entry: {
          ...entry,
        },
      };
      return update;
    },
    (uids) => uids,
  );

	console.log('TCL: childCacheEntries 777', JSON.stringify(childCacheEntries))
  context.cache[migrationConfig.name] = mergeCache(context.cache[migrationConfig.name], childCacheEntries)
	console.log('TCL: context.cache[migrationConfig.name] 888', JSON.stringify(context.cache[migrationConfig.name]))

  // Object.keys(context.cache[migrationConfig.name]).reduce(
  //   (acc, legacyUid) => {
  //     return {
  //       ...acc,
  //       [legacyUid]: {
  //         ...context.cache[migrationConfig.name][legacyUid],
  //         ...(childCacheEntries[legacyUid] && { ...childCacheEntries[legacyUid]})
  //       }
  //     };
  //   },
  //   {},
  // );
  reportUpdatedEntries(migrationConfig.name, childCacheEntries);
  return context.cache[migrationConfig.name];
};

export { migrateContentType };
