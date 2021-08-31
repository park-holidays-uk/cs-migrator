import 'cross-fetch/polyfill'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import {
  uploadLocationLogos,
  uploadLocationGalleries,
  uploadAccommodationGalleries,
} from './assets'
import {
  createHolidayProducts,
  createLocationAmenities,
  createLocationCategories,
  createLocations,
  createRegions,
} from './locationEntries'
import {
  createAccommodation,
  createAccommodationAmenities,
  createAccommodationGrades,
  createAccommodationTypes,
} from './accommodationEntries'
import { snakeCase } from './tools'
import loginForAuthToken from './login'
import { getDbConnection } from './db'

dotenv.config()

const { api_key, base_url, management_token, email } = process.env

const reportCreatedEntries = (key, context) => {
  console.log(`createdEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length)
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
  context.cache = {}
  try {
    context.cache = JSON.parse(readFileSync(path.resolve(__dirname, '../cache.json'), 'utf-8'))
  } catch (err) {
    /*
    No file -> ignore it!!
    (used for dev purposes: not having to re-create cache from beginning all the time)
    */
  }
  /*
  context.cache.locationLogos = await uploadLocationLogos(context)
  reportCreatedEntries('locationLogos', context)
  context.cache.locationGalleries = await uploadLocationGalleries(context)
  reportCreatedEntries('locationGalleries', context)
  // */
  context.cache.accommodationGalleries = await uploadAccommodationGalleries(context)
  reportCreatedEntries('accommodationGalleries', context)

   /*
  context.cache.holidayProducts = await createHolidayProducts(context)
  reportCreatedEntries('holidayProducts', context)
  context.cache.locationCategories = await createLocationCategories(context)
  reportCreatedEntries('locationCategories', context)
  context.cache.locationAmenities = await createLocationAmenities(context)
  reportCreatedEntries('locationAmenities', context)
  context.cache.regions = await createRegions(context)
  reportCreatedEntries('regions', context)
  context.cache.locations = await createLocations(context)
  reportCreatedEntries('locations', context)
  context.cache.accommodationTypes = await createAccommodationTypes(context)
  reportCreatedEntries('accommodationTypes', context)
  context.cache.accommodationGrades = await createAccommodationGrades(context)
  reportCreatedEntries('accommodationGrades', context)
  context.cache.accommodationAmenities = await createAccommodationAmenities(context)
  reportCreatedEntries('accommodationAmenities', context)
  context.cache.accommodation = await createAccommodation(context)
  reportCreatedEntries('accommodation', context)
  // */



  writeFileSync(path.resolve(__dirname, '../cache.json'), JSON.stringify(context.cache, null, 2))

  process.exit()
}

export default importData