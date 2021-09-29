import { EnvironmentType, MigrationConfigurationType } from '../types'
import {
  uploadLocationLogos,
  uploadLocationGalleries,
  uploadAccommodationGalleries,
} from '../assets/galleries'
import {
  createCounties,
  createHolidayProducts,
  createLocationAmenities,
  createLocationCategories,
  createLocations,
  createRegions,
} from '../entries/locationEntries'
import {
  createAccommodation,
  createAccommodationAmenities,
  createAccommodationGrades,
  createAccommodationTypes,
} from '../entries/accommodationEntries'
import dotenv from 'dotenv'
dotenv.config()

export const getEnvironmentVariables = (env: EnvironmentType) => ({
  api_key: process.env[`${env}_api_key`],
  base_url: process.env[`${env}_base_url`],
  management_token: process.env[`${env}_management_token`],
  email: process.env[`${env}_email`],
  Park_Logo: process.env[`${env}_Park_Logo`],
  Location_Media: process.env[`${env}_Location_Media`],
  Accommodation_Media: process.env[`${env}_Accommodation_Media`],
  environments: process.env[`${env}_environments`]
})

export const migrationConfiguration: MigrationConfigurationType[] = [{
    name: 'locationLogos',
    includeInMigration: false,
    type: 'asset',
    handler: uploadLocationLogos,
    folderName: 'Park_Logo',
  }, {
    name: 'locationGalleries',
    includeInMigration: false,
    type: 'asset',
    handler: uploadLocationGalleries,
    folderName: 'Location_Media',
  }, {
    name: 'accommodationGalleries',
    includeInMigration: false,
    type: 'asset',
    handler: uploadAccommodationGalleries,
    folderName: 'Accommodation_Media',
  }, {
    name: 'holidayProducts',
    includeInMigration: false,
    type: 'entry',
    handler: createHolidayProducts
  }, {
    name: 'locationCategories',
    includeInMigration: false,
    type: 'entry',
    handler: createLocationCategories
  }, {
    name: 'locationAmenities',
    includeInMigration: false,
    type: 'entry',
    handler: createLocationAmenities
  }, {
    name: 'regions',
    includeInMigration: false,
    type: 'entry',
    handler: createRegions
  }, {
    name: 'counties',
    includeInMigration: false,
    type: 'entry',
    handler: createCounties
  }, {
    name: 'locations',
    includeInMigration: false,
    type: 'entry',
    handler: createLocations
  }, {
    name: 'accommodationTypes',
    includeInMigration: false,
    type: 'entry',
    handler: createAccommodationTypes
  }, {
    name: 'accommodationGrades',
    includeInMigration: false,
    type: 'entry',
    handler: createAccommodationGrades
  }, {
    name: 'accommodationAmenities',
    includeInMigration: false,
    type: 'entry',
    handler: createAccommodationAmenities
  }, {
    name: 'accommodation',
    includeInMigration: true,
    type: 'entry',
    handler: createAccommodation
  },
]

export default {
  getEnvironmentVariables,
  migrationConfiguration
}