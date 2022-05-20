import 'cross-fetch/polyfill'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
import { getDbConnection } from '../../db'
import { createAdditionalStockImages } from '../../entries/locationEntries'
import { createEntries, findCachedEntryFromUid, getAllEntries, snakeCase } from '../../tools'
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
  context.db = await getDbConnection()
  context.env = env
  context.cache = getDataCache(env, migrationConfiguration.map((m) => m.name))

  // save a copy of current v1 entries
  const locationEntries = await getAllEntries(context, 'location')
  writeSync(env, 'migrationCache', 'location_preAdditionalStockImages', locationEntries)

  // let locationEntries = readSync(env, 'migrationCache', 'location_preAdditionalStockImages') // used for development

  const mockMigrationConfig = {
    name: 'location',
    updateKeys: {
      entry: {
        sales_product_contents: [{
          additional_stock_image: true
        }],
      }
    }
  } as any

  // context.cache.location = arrayToUidKeyedObject(locationEntries)
	console.log('TCL: migrateData -> context.cache.location', context.cache.location)

  // re-populate entries using new structure
  context.cache['location'] = await createEntries(
    mockMigrationConfig,
    context,
    'location',
    locationEntries,
    async (entry) => {
      const park = findCachedEntryFromUid(context, 'location', entry)
			console.log('TCL: migrateData -> park', park)
      const additional_images = await createAdditionalStockImages(context, 'additionalStockGallery', park.id)
			console.log('TCL: migrateData -> additional_images', additional_images)
      const update = {
        ...entry
      }
      delete update.id
			console.log('TCL: migrateData -> update', update)
      update.sales_product_contents[0].additional_images = additional_images;
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