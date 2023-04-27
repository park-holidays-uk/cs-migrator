import 'cross-fetch/polyfill';
import { arrayToKeyedObject, createEntries, getAllEntries, snakeCase } from '../tools';
import {
  CachedEntries,
  CreateBody,
  EntryObj,
  MigrationConfigurationType,
  ScraperCtx,
} from '../types';

const reportUpdatedEntries = (key, cachedEntries) => {
  console.log(
    `updatedEntries -> [ ${snakeCase(key)} ]`,
    Object.keys(cachedEntries).length,
    ' '.repeat(25),
  );
};

const mergeCache = (knownEntries: CachedEntries, mergeEntries: CachedEntries): CachedEntries =>
  Object.keys(knownEntries).reduce((acc, legacyUid) => {
    return {
      ...acc,
      [legacyUid]: {
        ...knownEntries[legacyUid],
        ...(mergeEntries[legacyUid] && { ...mergeEntries[legacyUid] }),
      },
    };
  }, {});

const defaultCreateBodyFn = async (entry: EntryObj) => {
  const update = {
    entry: {
      ...entry,
    },
  };
  return update;
};

const migrateAllEntriesForContentTypeToLegacy = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
  createBody: CreateBody = defaultCreateBodyFn,
  filterEntriesFn = (entry) => true,
): Promise<CachedEntries> => {
  const contentUid = migrationConfig.contentUid ?? snakeCase(migrationConfig.name);
  const parkLeisureEntries = await getAllEntries(context, 'parkleisure', contentUid);
  const parkLeisureCache = arrayToKeyedObject(
    parkLeisureEntries.map((entry) => ({
      parkleisure_uid: entry.uid,
      parkleisure_updated_at: entry.updated_at,
    })),
    'parkleisure_uid',
  );
  context.cache[migrationConfig.name] = mergeCache(
    parkLeisureCache,
    context.cache[migrationConfig.name],
  );

  const slicedEntries = parkLeisureEntries
    .filter(filterEntriesFn);

  // // re-populate entries using new structure
  const childCacheEntries = await createEntries(
    context,
    migrationConfig,
    contentUid,
    slicedEntries,
    createBody,
    (uids) => uids,
  );
  context.cache[migrationConfig.name] = mergeCache(
    context.cache[migrationConfig.name],
    childCacheEntries,
  );
  reportUpdatedEntries(migrationConfig.name, childCacheEntries);
  return context.cache[migrationConfig.name];
};

export { migrateAllEntriesForContentTypeToLegacy };
