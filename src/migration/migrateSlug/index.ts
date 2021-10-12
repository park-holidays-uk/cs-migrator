import 'cross-fetch/polyfill'
import { arrayToUidKeyedObject, createEntries, getAllEntries, snakeCase } from '../../tools'
import loginForAuthToken from '../../tools/login'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'


import { getDataCache, readSync, writeSync } from '../../dataHandler/fileCache'
import { EnvironmentType, MigrationConfigurationType } from '../../types'



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
  const locationEntries = await getAllEntries(context, 'location')
  writeSync(env, 'migrationCache', 'location_preSlug', locationEntries)

  // let locationEntries = readSync(env, 'migrationCache', 'location_V1') // used for development

  const mockMigrationConfig = {
    name: 'location',
    updateKeys: {
      entry: {
        slug: true
      }
    }
  } as any

  context.cache.location = arrayToUidKeyedObject(locationEntries)

  const createSlugFromTitle = (title: string) => title
  .trim()
  .toLowerCase()
  .split(' ')
  .join('-') + '-holiday-park'

  // re-populate entries using new structure
  context.cache['location'] = await createEntries(
    mockMigrationConfig,
    context,
    'location',
    locationEntries,
    async (entry) => {
      return ({
        entry: {
          ...entry,
          slug: createSlugFromTitle(entry.title)
        }
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