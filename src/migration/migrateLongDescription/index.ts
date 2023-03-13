import 'cross-fetch/polyfill'
import FormData from 'form-data'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
import { apiDelay, arrayToKeyedObject, createEntries, getAllAssets, getAllEntries, publishAsset, scrubExistingData, snakeCase } from '../../tools'
import { createApiCredentials } from '../../tools/login'
import { CachedEntries, EntryObj, EntryPayload, EnvironmentType, MigrationConfigType, MigrationConfigurationType, PublishEnvironments } from '../../types'
import { jsonToHtml } from "@contentstack/json-rte-serializer";
import { json } from 'node:stream/consumers'

const localEnvironments: PublishEnvironments[] = ['production', 'staging'];

const reportUpdatedEntries = (key, context) => {
  console.log(`updatedEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length, ' '.repeat(25))
}

const migrationConfig: MigrationConfigurationType = {
  name: 'stockUnit_pl',
  contentUid: 'stock_unit',
  type: 'entry',
  stackName: 'parkholidays',
  sourceStackName: 'parkholidays',
  publishEnvironments: localEnvironments,
  shouldCheckUpdatedAt: true,
  scrubbedFields: { tags: true },
  handler: () => {
    // not used to migrate -
    return Promise.resolve({})
  },
  includeInRemove: false,
  includeInMigration: true,
  updateKeys: {
    entry: {
      description: {
        long_description: true,
        json_long_description: true
      }
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
  const legacyEntries = await getAllEntries(context, migrationConfig.stackName, 'stock_unit');
  const legacyCache = arrayToKeyedObject(
    legacyEntries.map((entry) => ({
      parkholidays_uid: entry.uid,
      parkholidays_updated_at: entry.updated_at,
    })),
    'parkholidays_uid',
  );

  context.cache[migrationConfig.name] = mergeCache(legacyCache, context.cache[migrationConfig.name]);

  const createStockUnitBody = async (stockUnit: EntryObj): Promise<EntryPayload> => {
		console.log('TCL: migrateData -> stockUnit', JSON.stringify(stockUnit))
    const jsonLongDescription = jsonToHtml(stockUnit?.description?.json_long_description ?? {});
    const longDescription = (jsonLongDescription === '<p></p>' || jsonLongDescription === '')
      ? stockUnit.description.long_description
      : jsonLongDescription;

    return {
      entry: {
        description: {
          short_description: stockUnit.description.short_description,
          long_description: longDescription,
          json_long_description: stockUnit?.description?.json_long_description,
        }
      },
    };
  };

  let recordCount = 0;

  await createEntries(
    context,
    migrationConfig,
    'stock_unit',
    legacyEntries,
    createStockUnitBody,
    (uids) => uids,
  );
  process.exit()
}

migrateData()
