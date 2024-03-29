import 'cross-fetch/polyfill'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, readSync } from '../../dataHandler/fileCache'
import { arrayToUidKeyedObject, createEntries, snakeCase } from '../../tools'
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
  context.env = env
  context.cache = getDataCache(env, migrationConfiguration.map((m) => m.name))

  // save a copy of current v1 entries
  // const locationEntries = await getAllEntries(context, 'location')
  // writeSync(env, 'migrationCache', 'location_preMediaTextContent', locationEntries)

  let locationEntries = readSync(env, 'migrationCache', 'location_preMediaTextContent') // used for development
	console.log('TCL: migrateData -> locationEntries', locationEntries.length)

  locationEntries = locationEntries.filter((entry) => entry.title !== 'Hengar Manor')

  console.log('TCL: migrateData -> locationEntries', locationEntries.length)


  const mockMigrationConfig = {
    name: 'location',
    updateKeys: {
      entry: {
        sales_product_contents: [{
          media_text_content: {
            pages: true
          }
        }]
      }
    }
  } as any

  context.cache.location = arrayToUidKeyedObject(locationEntries)
  // // re-populate entries using new structure
  context.cache['location'] = await createEntries(
    mockMigrationConfig,
    context,
    'location',
    locationEntries,
    async (entry) => {
      const update = {...entry};
      if (update.sales_product_contents[0]) {
        update.sales_product_contents[0].media_text_content = {
          pages: []
        };
      }
      return ({
        entry: update
      })
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