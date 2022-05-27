import 'cross-fetch/polyfill'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
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
        id: park.id,
      }
    }
    return null;
  }).filter(Boolean);
  writeSync(env, 'migrationCache', 'location_preDefaultStockAddons', locationEntries)

  const mockMigrationConfig = {
    name: 'location',
    updateKeys: {
      entry: {
        sales_product_contents: [{
          additional_stock_addons: true,
          default_stock_addon_disclaimer: true,
        }],
      }
    }
  } as any

  // re-populate entries using new structure
  context.cache['location'] = await createEntries(
    mockMigrationConfig,
    context,
    'location',
    locationEntries,
    async (entry) => {
      const update = {...entry};
      if (!['PL', 'SS', 'TB'].includes(entry.park_code)) {
        update.sales_product_contents[0].additional_stock_addons = [{
          'uid': 'blt41bc18089d3ee265',
          '_content_type_uid': 'stock_addon'
        }];
        update.sales_product_contents[0].default_stock_addon_disclaimer = "*Superfast Internet package included within pitch fees. Subject to installation fee";
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