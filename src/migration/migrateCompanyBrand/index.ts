import 'cross-fetch/polyfill'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
import { arrayToUidKeyedObject, createEntries, findCachedEntryFromUid, getAllEntries, snakeCase } from '../../tools'
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
  let locationEntries = await getAllEntries(context, 'location')
  locationEntries = locationEntries.map((entry) => {
    const park = findCachedEntryFromUid(context, 'location', entry)
		console.log('TCL: migrateData -> park', park)
    if (park) {
      return {
        ...entry,
        // brand: [
        //   {
        //     "uid": "blt512eebdbfb8c0494",
        //     "_content_type_uid": "company_brand"
        //   },
        // ],
      }
    }
    return null;
  }).filter(Boolean);

  context.cache.location = arrayToUidKeyedObject(locationEntries)
  writeSync(env, 'migrationCache', 'location_preCompanyBrand', locationEntries);

   // let accommodationImages = readSync(env, 'migrationCache', 'accommodationImages_preTags') // used for development

  const mockMigrationConfig = {
    name: 'location',
    updateKeys: {
      entry: {
        brand: true,
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
      return {
        entry: {
          ...entry,
          brand: [
            {
              "uid": "blt512eebdbfb8c0494",
              "_content_type_uid": "company_brand"
            },
          ]
        }
      }
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