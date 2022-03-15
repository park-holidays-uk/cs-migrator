import dotenv from 'dotenv'
import {
  uploadAccommodationGalleries, uploadLocationGalleries, uploadLocationLogos
} from '../assets/galleries'
import {
  createAccommodation,
  createAccommodationAmenities,
  createAccommodationGrades,
  createAccommodationTypes
} from '../entries/accommodationEntries'
import {
  createCounties,
  createHolidayProducts,
  createLocationAmenities,
  createLocationCategories,
  createLocations,
  createRegions
} from '../entries/locationEntries'
import { EnvironmentType, MigrationConfigurationType } from '../types'
dotenv.config();

export const getEnvironmentVariables = (env: EnvironmentType) => ({
  api_key: process.env[`${env}_api_key`],
  base_url: process.env[`${env}_base_url`],
  management_token: process.env[`${env}_management_token`],
  email: process.env[`${env}_email`],
  Park_Logo: process.env[`${env}_Park_Logo`],
  Location_Media: process.env[`${env}_Location_Media`],
  Accommodation_Media: process.env[`${env}_Accommodation_Media`],
  Stock_Media: process.env[`${env}_Stock_Media`],
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
    name: 'locationGalleryTouring',
    type: 'asset',
    handler: async (context, migrationConfig) => uploadLocationGalleries(context, migrationConfig, 'touring', ['touring']),
    folderName: 'Location_Media',
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none', // images cannot update - always 'none'
    removalTags: ['touring'],
  }, {
    name: 'locationGalleryHolidays',
    type: 'asset',
    handler: async (context, migrationConfig) => uploadLocationGalleries(context, migrationConfig, 'holidays', ['holidays']),
    folderName: 'Location_Media',
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none', // images cannot update - always 'none'
    removalTags: ['holidays'],
  }, {
    name: 'locationGalleryOwnership',
    type: 'asset',
    handler: async (context, migrationConfig) => uploadLocationGalleries(context, migrationConfig, 'ownership', ['sales']),
    folderName: 'Location_Media',
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none', // images cannot update - always 'none'
    removalTags: ['sales'],
  }, {
    name: 'stockGallery',
    type: 'asset',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    folderName: 'Stock_Media',
    includeInRemove: true,
    includeInMigration: false,
    updateKeys: 'none',  // images cannot update - always 'none'
    removalTags: ['cms_scraped'],
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
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: {
      entry: {
        // holiday_product_contents: [{
        //   contextual_images: false,
        // }],
        sales_product_contents: false,
      }
    },
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
    updateKeys: {
      entry: {
        media: false
      }
    },
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
    updateKeys: {
      entry: { // This will only update the truthy keys. everything else left as is.
        pets_allowed: false,
        accessible: false,
        accommodation_amenities: false,
        contextual_images: false,
      }
    },
  }, {
    name: 'stockAddon',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockAmenity',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockCondition',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockManufacturer',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockModel',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockStatus',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockType',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockUnit',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    includeInRemove: true,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'locationStockPrice',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... */},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }
]

export default {
  getEnvironmentVariables,
  migrationConfiguration
}