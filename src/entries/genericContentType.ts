import 'cross-fetch/polyfill';
import { arrayToKeyedObject, createEntries, getAllEntries, snakeCase } from '../tools';
import { CachedEntries, CreateBody, EntryObj, MigrationConfigurationType, ScraperCtx } from '../types';

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

const defaultCreateBodyFn = async (entry: EntryObj) => {
  const update = {
    entry: {
      ...entry,
    },
  };
  return update;
};

const migrateAllEntriesForContentType = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
  createBody: CreateBody = defaultCreateBodyFn,
): Promise<CachedEntries> => {
  const contentUid = migrationConfig.contentUid ?? snakeCase(migrationConfig.name);
	console.log('TCL: contentUid', contentUid)
  const legacyEntries = await getAllEntries(context, migrationConfig.sourceStackName, contentUid);
  const legacyCache = arrayToKeyedObject(
    legacyEntries.map((entry) => ({
      legacy_uid: entry.uid,
      legacy_updated_at: entry.updated_at,
    })),
    'legacy_uid',
  );
  context.cache[migrationConfig.name] = mergeCache(legacyCache, context.cache[migrationConfig.name]);

  // // re-populate entries using new structure
  const childCacheEntries = await createEntries(
    context,
    migrationConfig,
    contentUid,
    legacyEntries,
    createBody,
    (uids) => uids,
  );
  context.cache[migrationConfig.name] = mergeCache(context.cache[migrationConfig.name], childCacheEntries)
  reportUpdatedEntries(migrationConfig.name, childCacheEntries);
  return context.cache[migrationConfig.name];
};

export { migrateAllEntriesForContentType };
