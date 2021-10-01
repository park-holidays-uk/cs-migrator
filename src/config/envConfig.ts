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
    type: 'asset',
    handler: uploadLocationLogos,
    folderName: 'Park_Logo',
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false, // images cannot update - always migrated with a unique id
  }, {
    name: 'locationGalleries',
    type: 'asset',
    handler: uploadLocationGalleries,
    folderName: 'Location_Media',
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false, // images cannot update - always migrated with a unique id
  }, {
    name: 'accommodationGalleries',
    type: 'asset',
    handler: uploadAccommodationGalleries,
    folderName: 'Accommodation_Media',
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false, // images cannot update - always migrated with a unique id
  }, {
    name: 'holidayProducts',
    type: 'entry',
    handler: createHolidayProducts,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  }, {
    name: 'locationCategories',
    type: 'entry',
    handler: createLocationCategories,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  }, {
    name: 'locationAmenities',
    type: 'entry',
    handler: createLocationAmenities,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  }, {
    name: 'regions',
    type: 'entry',
    handler: createRegions,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  }, {
    name: 'counties',
    type: 'entry',
    handler: createCounties,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  }, {
    name: 'locations',
    type: 'entry',
    handler: createLocations,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  }, {
    name: 'accommodationTypes',
    type: 'entry',
    handler: createAccommodationTypes,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  }, {
    name: 'accommodationGrades',
    type: 'entry',
    handler: createAccommodationGrades,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  }, {
    name: 'accommodationAmenities',
    type: 'entry',
    handler: createAccommodationAmenities,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  }, {
    name: 'accommodation',
    type: 'entry',
    handler: createAccommodation,
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false,
  },
]

export default {
  getEnvironmentVariables,
  migrationConfiguration
}