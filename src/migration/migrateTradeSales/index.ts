import 'cross-fetch/polyfill'
import FormData from 'form-data'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, readSync, writeSync } from '../../dataHandler/fileCache'
import { apiDelay, arrayToUidKeyedObject, createEntries, getAllAssets, publishAsset, scrubExistingData, snakeCase } from '../../tools'
import loginForAuthToken from '../../tools/login'
import { EnvironmentType } from '../../types'


const CMS_SCRAPER_TAG = 'cms-scraped';


const env = process.argv[2] as EnvironmentType

const { api_key, base_url, management_token, email, Accommodation_Media } = getEnvironmentVariables(env)

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
  context.cache = {}

  const contentType = 'stock_type'
  context.cache[contentType] = {};

  const entries = readSync(env, 'migrationCache', contentType) // used for development
  const mockMigrationConfig = {
    name: contentType,
    updateKeys: {
      entry: {
        title: true
      }
    }
  } as any


  const entriesArr = Object.keys(entries).map((key) => scrubExistingData(entries[key], { uid: true, publish_details: true, tags: true }))
	console.log('TCL: migrateData -> entriesArr', entriesArr)

  // re-populate entries using new structure
  context.cache[contentType] = await createEntries(
    mockMigrationConfig,
    context,
    contentType,
    entriesArr,
    async (entry) => {
      return ({
        entry: {
          ...entry,
        }
      })
    },
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'cli-export',
    })
  )
  reportUpdatedEntries(contentType, context)
  process.exit()
}

migrateData()