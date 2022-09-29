import 'cross-fetch/polyfill'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
import { arrayToUidKeyedObject, createEntries, getAllEntries, snakeCase } from '../../tools'
import loginForAuthToken from '../../tools/login'
import { EnvironmentType } from '../../types'

const env = process.argv[2] as EnvironmentType

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const reportUpdatedEntries = (key, context) => {
  console.log(`updatedEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length, ' '.repeat(25))
}

const migrateData = async () => {
  console.log('\n\n Build Complete!! Starting migration... \n\n\n')
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
  // context.db = await getDbConnection()
  context.env = env
  context.cache = getDataCache(env, migrationConfiguration.map((m) => m.name))

  // save a copy of current v1 entries
  const accommodationEntries = await getAllEntries(context, 'accommodation');

  context.cache.accommodation = arrayToUidKeyedObject(accommodationEntries)
  writeSync(env, 'migrationCache', 'accommodation_preMigrateTouringType', accommodationEntries);

   // let accommodationEntries = readSync(env, 'migrationCache', 'accommodation_preMigrateTouringType'); // used for development

  const mockMigrationConfig = {
    name: 'accommodation',
    updateKeys: {
      entry: {
        touring: [{
          touring_type: true
        }],
      }
    }
  } as any

  // // re-populate entries using new structure
  context.cache['location'] = await createEntries(
    mockMigrationConfig,
    context,
    'location',
    locationEntries,
    async (entry) => {
      const update =  {
        entry: {
          ...entry,
        }
      }
      update.entry.holiday_product_contents = update.entry.holiday_product_contents.map((hp) => ({
        ...hp,
        is_visible: true
      }));
      update.entry.sales_product_contents = update.entry.sales_product_contents.map((sp) => ({
        ...sp,
        is_visible: true
      }))
      return update;
    },
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.parks',
    })
  )
  reportUpdatedEntries('location', context)
  process.exit()
}

migrateData()