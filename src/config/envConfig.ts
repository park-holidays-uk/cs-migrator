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
  Icon_Star: process.env[`${env}_Icon_Star`],
  environments: process.env[`${env}_environments`]
})

export const migrationConfiguration: MigrationConfigurationType[] = [{
    name: 'locationLogo',
    type: 'asset',
    handler: uploadLocationLogos,
    folderName: 'Park_Logo',
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none', // images cannot update - always 'none'
  }, {
    name: 'locationGallery',
    type: 'asset',
    handler: uploadLocationGalleries,
    folderName: 'Location_Media',
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none', // images cannot update - always 'none'
  }, {
    name: 'accommodationGallery',
    type: 'asset',
    handler: uploadAccommodationGalleries,
    folderName: 'Accommodation_Media',
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none', // images cannot update - always 'none'
  }, {
    name: 'holidayProduct',
    type: 'entry',
    handler: createHolidayProducts,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'locationCategory',
    type: 'entry',
    handler: createLocationCategories,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'locationAmenity',
    type: 'entry',
    handler: createLocationAmenities,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'region',
    type: 'entry',
    handler: createRegions,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'county',
    type: 'entry',
    handler: createCounties,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'location',
    type: 'entry',
    handler: createLocations,
    includeInRemove: true,
    includeInMigration: true,
    updateKeys: 'all',
  }, {
    name: 'accommodationType',
    type: 'entry',
    handler: createAccommodationTypes,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'accommodationGrade',
    type: 'entry',
    handler: createAccommodationGrades,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'accommodationAmenity',
    type: 'entry',
    handler: createAccommodationAmenities,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'accommodation',
    type: 'entry',
    handler: createAccommodation,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  },
]

export default {
  getEnvironmentVariables,
  migrationConfiguration
}