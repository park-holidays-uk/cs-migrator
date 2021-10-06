import 'cross-fetch/polyfill'
import { arrayToUidKeyedObject, createEntries, getAllEntries, snakeCase } from '../../tools'
import loginForAuthToken from '../../tools/login'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'

import { fetchContentType } from '../../contentTypes/export'
import { updateContentType } from '../../contentTypes/import'
import { getDataCache, readSync, writeSync } from '../../dataHandler/fileCache'
import { EnvironmentType, MigrationConfigurationType } from '../../types'

import locationSchemaV2 from './locationSchemaV2.json'

const env = process.argv[2] as EnvironmentType
console.log("TCL: env", env)

const { api_key, base_url, management_token, email, Icon_Star } = getEnvironmentVariables(env)

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
  // writeSync(env, 'migrationCache', 'location_V1', locationEntries)

  let locationEntries = readSync(env, 'migrationCache', 'location_V1')

  // export & update content-type structure
  // const locationContentType = await fetchContentType(context, 'content_types', 'location')
  // locationContentType.content_type.schema = locationSchemaV2
  // await updateContentType(context, locationContentType.content_type, 'content_types', 'location')

  const mockMigrationConfig = {
    name: 'location',
    updateKeys: 'all'
  } as MigrationConfigurationType

  context.cache.location = arrayToUidKeyedObject(locationEntries)

  const getParkLogo = (entry) => {
    if (entry.park_logo.length && entry.park_logo[0].media.length) {
      return {
        park_logo: {
          image: entry.park_logo[0].media[0].file.file.uid
        }
      }
    }
    return {}
  }

  const getProductOverview = (holidayProductDetails) => {
    const overviews = holidayProductDetails.filter((pd) => pd.holiday_product_overviews)
    if (overviews.length) {
      return {
        overview: {
          short_overview: overviews[0].holiday_product_overviews.holiday_product_short_overview,
          long_overview: overviews[0].holiday_product_overviews.holiday_product_long_overview
        }
      }
    }
    return {}
  }

  const getProductHighlights = (holidayProductDetails) => {
    const highlights = holidayProductDetails.filter((pd) => pd.holiday_product_reasons)
    if (highlights.length) {
      return {
        highlights:  highlights[0].holiday_product_reasons.holiday_product_reason.map((reason) => {
          return {
            icon: [{
              uid: Icon_Star,
              _content_type_uid: 'icon'
            }],
            title: reason.toString()
          }
        })
      }
    }
    return {}
  }

  const getProductImages = (holidayProductDetails) => {
    const images = holidayProductDetails
      .filter((pd) => pd.holiday_product_media)
      .reduce((acc, holidayProductMedia) => {
        return [...acc, ...holidayProductMedia.holiday_product_media.media]
      }, [])
      .map((media) => ({
        image: media.file.file.uid
      }))
    if (images.length) {
      return {
        contextual_images: images
      }
    }
    return {}
  }

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
          ...getParkLogo(entry),
          holiday_product_contents: entry.product_content.map((pc) => {
            return {
              holiday_product: pc.holiday_product.holiday_product_reference,
              ...getProductOverview(pc.holiday_product.holiday_product_details),
              ...getProductHighlights(pc.holiday_product.holiday_product_details),
              ...getProductImages(pc.holiday_product.holiday_product_details),
            }
          })
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