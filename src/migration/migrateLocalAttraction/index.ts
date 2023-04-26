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

const localEnvironments: PublishEnvironments[] = ['production', 'staging'];
const globalParkLeisureEnvironments: PublishEnvironments[] = ['production', 'production_parkleisure', 'staging', 'production_parkleisure'];

const reportUpdatedEntries = (key, context) => {
  console.log(`updatedEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length, ' '.repeat(25))
}

const migrationConfig: MigrationConfigurationType = {
  name: 'localAttraction',
  contentUid: 'local_attraction',
  type: 'entry',
  stackName: 'parkleisure',
  sourceStackName: 'parkleisure',
  publishEnvironments: localEnvironments,
  shouldCheckUpdatedAt: false,
  // scrubbedFields: { tags: true },
  handler: () => {
    // not used to migrate -
    return Promise.resolve({})
  },
  includeInRemove: false,
  includeInMigration: true,
  updateKeys: {
    entry: {
      address: {
        county: true,
      }
    }
  },
}

const migrateData = async () => {
  console.log('\n\n Build Complete!! Starting migration... \n\n\n')

  const context = await createApiCredentials({
    // CS_BASE_URL: 'https://eu-api.contentstack.com/v3',
    CS_BASE_URL: 'https://4y0ax61fd7.execute-api.eu-west-2.amazonaws.com/default',
  })
  // context.cache = getDataCache(migrationConfiguration.map((m) => m.name))

  // save a copy of current v1 entries
  const legacyEntries = await getAllEntries(context, migrationConfig.stackName, 'local_attraction');
  const legacyCache = arrayToKeyedObject(
    legacyEntries.map((entry) => ({
      parkleisure_uid: entry.uid,
      parkleisure_updated_at: entry.updated_at,
    })),
    'parkleisure_uid'
  );
  context.cache = {
    [migrationConfig.name]: legacyCache
  };

  const createLocalAttractionBody = async (localAttraction: EntryObj): Promise<EntryPayload> => {
		console.log('TCL: migrateData -> localAttraction', localAttraction?.address?.county)
    const county = localAttraction.address?.county?.trim()?.length ? localAttraction.address.county : ' ';
		console.log('TCL: migrateData -> county', county)
    return {
      entry: {
        address: {
          county,
        }
      },
    };
  };

  let recordCount = 0;

  const onlyOne = legacyEntries.slice(0, 1)

  await createEntries(
    context,
    migrationConfig,
    'local_attraction',
    legacyEntries,
    createLocalAttractionBody,
    (uids) => uids,
  );
  process.exit()
}

migrateData()
