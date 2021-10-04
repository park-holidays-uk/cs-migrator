import 'cross-fetch/polyfill'
import { arrayToUidKeyedObject, createEntries, getAllEntries, snakeCase } from '../../tools'
import loginForAuthToken from '../../tools/login'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'

import { fetchContentType } from '../../contentTypes/export'
import { updateContentType } from '../../contentTypes/import'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
import { EnvironmentType, MigrationConfigurationType } from '../../types'

import locationSchemaV2 from './locationSchemaV2.json'

const env = process.argv[2] as EnvironmentType
console.log("TCL: env", env)

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const reportCreatedEntries = (key, context) => {
  console.log(`createdEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length, ' '.repeat(25))
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
  let locationEntries = await getAllEntries(context, 'location')
  writeSync(env, 'migrationCache', 'location_V1', locationEntries)

  locationEntries = locationEntries.slice(0, 2)
	console.log("TCL: migrateData -> locationEntries", locationEntries.length)

  // export & update content-type structure
  // const locationContentType = await fetchContentType(context, 'content_types', 'location')
  // locationContentType.content_type.schema = locationSchemaV2
  // await updateContentType(context, locationContentType.content_type, 'content_types', 'location')

  const mockMigrationConfig = {
    name: 'location',
    updateKeys: 'all'
  } as MigrationConfigurationType

  // context.cache.location = arrayToUidKeyedObject(locationEntries)
  // re-populate entries using new structure
  // const locationEntryResponses = await createEntries(
  //   mockMigrationConfig,
  //   context,
  //   'location',
  //   locationEntries,
  //   async (entry) => {
	// 		console.log("TCL: migrateData -> entry", entry)
  //     return ({
  //       entry: {
  //         ...entry,
  //         park_logo: {
  //           image: entry
  //         }
  //         // 'park_logo': parkLogos,
  //         // 'location_category': [{
  //         //   'uid': context.cache.locationCategory[park['type_id']].uid,
  //         //   '_content_type_uid': 'location_category'
  //         // }],
  //         // 'location_amenities': parkFacilities.map((facility) => ({
  //         //   'uid': context.cache.locationAmenity[facility.id].uid,
  //         //   '_content_type_uid': 'location_amenity'
  //         // })),
  //         // 'product_content': locationProductContent,
  //         // 'park_code': park['code']
  //       }
  //     })
  //   },
  //   () => ({ /* No cache required */ })
  // )





  const accommodationEntries = await getAllEntries(context, 'accommodation')
  writeSync(env, 'migrationCache', 'accommodation_V1', accommodationEntries)
  // const migrations = migrationConfiguration.filter((migration) => {
  //   return migration.includeInMigration
  // })

  // for (const migrationConfig of migrations) {
  //   try {
  //     context.cache[migrationConfig.name] = await migrationConfig.handler(context, migrationConfig)
  //     reportCreatedEntries(migrationConfig.name, context)
  //     writeDataSync(env, migrationConfig.name, context.cache[migrationConfig.name])
  //   } catch (error) {
  //     console.error('Error during migrations ',  error)
  //     console.error('Cache saved at this point: ', migrationConfig)
  //     console.error('Cache: ', context.cache[migrationConfig.name])
  //   } finally {

  //   }
  // }
  process.exit()
}

migrateData()