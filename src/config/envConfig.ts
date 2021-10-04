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
    name: 'locationLogo',
    type: 'asset',
    handler: uploadLocationLogos,
    folderName: 'Park_Logo',
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false, // images cannot update - always migrated with a unique id
  }, {
    name: 'locationGallery',
    type: 'asset',
    handler: uploadLocationGalleries,
    folderName: 'Location_Media',
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false, // images cannot update - always migrated with a unique id
  }, {
    name: 'accommodationGallery',
    type: 'asset',
    handler: uploadAccommodationGalleries,
    folderName: 'Accommodation_Media',
    includeInRemove: false,
    includeInMigration: false,
    shouldUpdate: false, // images cannot update - always migrated with a unique id
  }, {
    name: 'holidayProduct',
    type: 'entry',
    handler: createHolidayProducts,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  }, {
    name: 'locationCategory',
    type: 'entry',
    handler: createLocationCategories,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  }, {
    name: 'locationAmenity',
    type: 'entry',
    handler: createLocationAmenities,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  }, {
    name: 'region',
    type: 'entry',
    handler: createRegions,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  }, {
    name: 'county',
    type: 'entry',
    handler: createCounties,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  }, {
    name: 'location',
    type: 'entry',
    handler: createLocations,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  }, {
    name: 'accommodationType',
    type: 'entry',
    handler: createAccommodationTypes,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  }, {
    name: 'accommodationGrade',
    type: 'entry',
    handler: createAccommodationGrades,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  }, {
    name: 'accommodationAmenity',
    type: 'entry',
    handler: createAccommodationAmenities,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  }, {
    name: 'accommodation',
    type: 'entry',
    handler: createAccommodation,
    includeInRemove: false,
    includeInMigration: true,
    shouldUpdate: false,
  },
]

export default {
  getEnvironmentVariables,
  migrationConfiguration
}