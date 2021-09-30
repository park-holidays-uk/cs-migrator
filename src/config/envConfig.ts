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
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'locationGalleries',
    type: 'asset',
    handler: uploadLocationGalleries,
    folderName: 'Location_Media',
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'accommodationGalleries',
    type: 'asset',
    handler: uploadAccommodationGalleries,
    folderName: 'Accommodation_Media',
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'holidayProducts',
    type: 'entry',
    handler: createHolidayProducts,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'locationCategories',
    type: 'entry',
    handler: createLocationCategories,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'locationAmenities',
    type: 'entry',
    handler: createLocationAmenities,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'regions',
    type: 'entry',
    handler: createRegions,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'counties',
    type: 'entry',
    handler: createCounties,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'locations',
    type: 'entry',
    handler: createLocations,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'accommodationTypes',
    type: 'entry',
    handler: createAccommodationTypes,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'accommodationGrades',
    type: 'entry',
    handler: createAccommodationGrades,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'accommodationAmenities',
    type: 'entry',
    handler: createAccommodationAmenities,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  }, {
    name: 'accommodation',
    type: 'entry',
    handler: createAccommodation,
    includeInRemove: true,
    includeInMigration: true,
    shouldUpdate: true,
  },
]

export default {
  getEnvironmentVariables,
  migrationConfiguration
}