import 'cross-fetch/polyfill';
import { getDataCache, writeSync } from '../dataHandler/fileCache';
import { arrayToKeyedObject, createEntries, getAllEntries, snakeCase } from '../tools';
import { CachedEntries, EntryObj, EntryPayload, MigrationConfigurationType, ScraperCtx } from '../types';

const reportUpdatedEntries = (key, cachedEntries) => {
  console.log(
    `updatedEntries -> [ ${snakeCase(key)} ]`,
    Object.keys(cachedEntries).length,
    ' '.repeat(25),
  );
};

const migrateContentType = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const contentUid = migrationConfig.contentUid ?? snakeCase(migrationConfig.name);

  const legacyEntries = await getAllEntries(context, 'legacy', contentUid);
  console.log('TCL: legacyEntries', JSON.stringify(legacyEntries));

  context.cache[migrationConfig.name] = arrayToKeyedObject(
    legacyEntries.map((entry) => ({
      legacyUid: entry.uid,
      updated_at: entry.updated_at,
    })),
    'legacyUid',
  );

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
  context.cache[migrationConfig.name] = Object.keys(context.cache[migrationConfig.name]).reduce(
    (acc, legacyUid) => {
      return {
        ...acc,
        [legacyUid]: {
          ...context.cache[migrationConfig.name][legacyUid],
          ...(childCacheEntries[legacyUid] && { ...childCacheEntries[legacyUid]})
        }
      };
    },
    {},
  );
  reportUpdatedEntries(migrationConfig.name, childCacheEntries);
  return context.cache[migrationConfig.name];
};

export { migrateContentType };
