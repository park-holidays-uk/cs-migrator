import 'cross-fetch/polyfill'
import { snakeCase } from './tools'
import loginForAuthToken from './tools/login'
import { getDbConnection } from './db'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from './config/envConfig'
import { getCache, writeSync } from './dataHandler/fileCache'
import { EnvironmentType } from './types'

const env = process.argv[2] as EnvironmentType

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const reportCreatedEntries = (key, context) => {
  console.log(`createdEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length, ' '.repeat(25))
}

const importData = async () => {
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
  context.cache = getCache(env, migrationConfiguration.map((m) => m.name))

  const migrations = migrationConfiguration.filter((migration) => {
    return migration.includeInMigration
  })

  for (const migrationConfig of migrations) {
    try {
      context.cache[migrationConfig.name] = await migrationConfig.handler(context, migrationConfig)
      reportCreatedEntries(migrationConfig.name, context)
      writeSync(env, migrationConfig.name, context.cache[migrationConfig.name])
    } catch (error) {
      console.error('Error during migrations ',  error)
      console.error('Cache saved at this point: ', migrationConfig)
      console.error('Cache: ', context.cache[migrationConfig.name])
    } finally {

    }
  }

  // context.cache.locationLogos = await uploadLocationLogos(context)
  // reportCreatedEntries('locationLogos', context)
  // context.cache.locationGalleries = await uploadLocationGalleries(context)
  // reportCreatedEntries('locationGalleries', context)
  // context.cache.accommodationGalleries = await uploadAccommodationGalleries(context)
  // reportCreatedEntries('accommodationGalleries', context)
  // context.cache.holidayProducts = await createHolidayProducts(context)
  // reportCreatedEntries('holidayProducts', context)
  // context.cache.locationCategories = await createLocationCategories(context)
  // reportCreatedEntries('locationCategories', context)
  // context.cache.locationAmenities = await createLocationAmenities(context)
  // reportCreatedEntries('locationAmenities', context)
  // context.cache.regions = await createRegions(context)
  // reportCreatedEntries('regions', context)
  // context.cache.counties = await createCounties(context)
  // reportCreatedEntries('counties', context)
  // context.cache.locations = await createLocations(context)
  // reportCreatedEntries('locations', context)
  // context.cache.accommodationTypes = await createAccommodationTypes(context)
  // reportCreatedEntries('accommodationTypes', context)
  // context.cache.accommodationGrades = await createAccommodationGrades(context)
  // reportCreatedEntries('accommodationGrades', context)
  // context.cache.accommodationAmenities = await createAccommodationAmenities(context)
  // reportCreatedEntries('accommodationAmenities', context)
  // context.cache.accommodation = await createAccommodation(context)
  // reportCreatedEntries('accommodation', context)

  // writeFileSync(path.resolve(__dirname, '../cache.json'), JSON.stringify(context.cache, null, 2))

  process.exit()
}

export default importData