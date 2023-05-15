import 'cross-fetch/polyfill'
import FormData from 'form-data'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
import { apiDelay, arrayToKeyedObject, createEntries, getAllAssets, getAllEntries, publishAsset, scrubExistingData, snakeCase } from '../../tools'
import { createApiCredentials } from '../../tools/login'
import { CachedEntries, EntryObj, EntryPayload, EnvironmentType, MigrationConfigType, MigrationConfigurationType, PublishEnvironments, TargetStackName } from '../../types'
import { jsonToHtml } from "@contentstack/json-rte-serializer";
import { json } from 'node:stream/consumers'

const localEnvironments: PublishEnvironments[] = ['production', 'staging'];

const reportUpdatedEntries = (key, context) => {
  console.log(`updatedEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length, ' '.repeat(25))
}

const migrationConfig: MigrationConfigurationType = {
  name: 'stockUnit_legacy',
  contentUid: 'stock_unit',
  type: 'entry',
  stackName: 'legacy' as TargetStackName,
  sourceStackName: 'legacy',
  publishEnvironments: localEnvironments,
  shouldCheckUpdatedAt: true,
  handler: () => {
    // not used to migrate -
    return Promise.resolve({})
  },
  includeInRemove: false,
  includeInMigration: true,
  updateKeys: {
    entry: {
      tags: true
    }
  },
}

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

const migrateData = async () => {
  console.log('\n\n Build Complete!! Starting migration... \n\n\n')

  const context = await createApiCredentials({
    // CS_BASE_URL: 'https://eu-api.contentstack.com/v3',
    CS_BASE_URL: 'https://4y0ax61fd7.execute-api.eu-west-2.amazonaws.com/default',
  })
  context.cache = getDataCache(migrationConfiguration.map((m) => m.name))

  // save a copy of current v1 entries
  const allLegacyEntries = await getAllEntries(context, migrationConfig.stackName, 'stock_unit');
  const legacyCache = arrayToKeyedObject(
    allLegacyEntries.map((entry) => ({
      legacy_uid: entry.uid,
      legacy_updated_at: entry.updated_at,
    })),
    'legacy_uid',
  );

  context.cache[migrationConfig.name] = mergeCache(legacyCache, context.cache[migrationConfig.name]);

  const createStockUnitBody = async (stockUnit: EntryObj): Promise<EntryPayload> => {
		console.log('TCL: migrateData -> stockUnit', JSON.stringify(stockUnit))

    const tags = (stockUnit.tags ?? [] ).filter(tag => tag !== 'cms_scraped');
    return {
      entry: {
        title: stockUnit.title,
        tags,
      },
    };
  };

  let recordCount = 0;

  const plLocations = {
    blte8f7de11a3c5212f: 'Amble Links',
    blt92b352a76e1deb26: 'Plas Coch',
    blt2214b80873d1ab58: 'Brynteg',
    blt8729bb9060158b9a: 'Par Sands',
    bltbbb91cadfe434871: 'Oyster Bay',
    bltaad89a9f654fab35: 'Pentire',
    bltfe34c276b79f4a3b: 'Ribble Valley',
    blt0734dcac1db02091: 'Malvern View',
    bltd1a2b77d711153f2: 'Yorkshire Dales',
    blt7223d4a3aff2c37e: 'Chantry',
    blt3aee70d4210dddad: 'Littondale',
  };

	console.log('TCL: migrateData -> allLegacyEntries', allLegacyEntries.length)
  const legacyPlEntries = allLegacyEntries.filter((entry) => {
    return plLocations[entry.location?.[0]?.uid]
  });
  console.log('TCL: migrateData -> legacyEntries', legacyPlEntries.length)

  await createEntries(
    context,
    migrationConfig,
    'stock_unit',
    legacyPlEntries,
    createStockUnitBody,
    (uids) => uids,
  );
  process.exit()
}

migrateData()
