import dotenv from 'dotenv';
import {
  updateCreateLocationsInGlobal,
  migrateAllEntriesForContentType,
  updateLocationsInChild,
} from '../entries';
import {
  uploadLocationImagesFromLegacy
} from '../assets';
import { EnvironmentType, MigrationConfigurationType, PublishEnvironments } from '../types';
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

const globalAllEnvironments: PublishEnvironments[] = ['production', 'production_parkholidays', 'production_parkleisure', 'staging', 'staging_parkholidays', 'staging_parkleisure'];
const globalParkHolidaysEnvironments: PublishEnvironments[] = ['production', 'production_parkholidays', 'staging', 'staging_parkholidays'];
const globalParkLeisureEnvironments: PublishEnvironments[] = ['production', 'production_parkleisure', 'staging', 'production_parkleisure'];
const localEnvironments: PublishEnvironments[] = ['production', 'staging'];

export const migrationConfiguration: MigrationConfigurationType[] = [
  {
    name: 'county',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'enquiryForm',
    contentUid: 'enquiry_form',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'holidayProduct',
    contentUid: 'holiday_product',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: true,
    scrubbedFields: { tags: true },
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'icon',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'location',
    contentUid: 'location',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: true,
    handler: () => {
      // not used to migrate -
      // location cache is made up from combining location_ph && location_pl data
      // only used for reference switching and or deleting locations
      return Promise.resolve({})
    },
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'locationChild_ph',
    cacheLookupKey: 'location',
    contentUid: 'location',
    type: 'entry',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: updateLocationsInChild,
    includeInRemove: false,
    includeInMigration: true,
    updateKeys: 'all',
  }, {
    name: 'locationChild_pl',
    cacheLookupKey: 'location',
    contentUid: 'location',
    type: 'entry',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: updateLocationsInChild,
    includeInRemove: false,
    includeInMigration: true,
    updateKeys: 'all',
  }, {
    name: 'locationImages_ph',
    type: 'asset',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: uploadLocationImagesFromLegacy,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'locationImages_pl',
    type: 'asset',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: uploadLocationImagesFromLegacy,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'location_ph',
    contentUid: 'location',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalParkHolidaysEnvironments,
    shouldCheckUpdatedAt: false,
    handler: updateCreateLocationsInGlobal,
    includeInRemove: false,
    includeInMigration: false, // This should never need running again - use child version
    updateKeys: 'all',
  }, {
    name: 'location_pl',
    contentUid: 'location',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalParkLeisureEnvironments,
    shouldCheckUpdatedAt: false,
    handler: updateCreateLocationsInGlobal,
    includeInRemove: false,
    includeInMigration: false, // This should never need running again - use child version
    updateKeys: 'all',
  }, {
    name: 'localAttraction',
    contentUid: 'local_attraction',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    scrubbedFields: { tags: true },
    shouldCheckUpdatedAt: false,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'locationActivity',
    contentUid: 'location_activity',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    scrubbedFields: { tags: true },
    shouldCheckUpdatedAt: false,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'locationAmenity',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'locationCategory',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'navigation',
    type: 'entry',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'redirects',
    type: 'entry',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'region',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }
  /*
  {
    name: 'locationLogo',
    type: 'asset',
    handler: uploadLocationLogos,
    folderName: 'Park_Logo',
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none', // images cannot update - always 'none'
  }
  , {
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
    handler: () => {/* not used to migrate only delete... *//*},
    folderName: 'Stock_Media',
    includeInRemove: false,
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
    removalTags: ['cms-scraped'],
  }, {
    name: 'additionalStockGallery',
    type: 'asset',
    handler: additionalStockGalleries,
    folderName: 'Location_Media',
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none', // images cannot update - always 'none'
    removalTags: ['additional_stock'],
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
    name: 'webpage',
    type: 'entry',
    handler: createOwnershipParkWebpages,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'location',
    type: 'entry',
    handler: createLocations,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: {
      entry: {
        // slug: false,
        // holiday_product_contents: [{
        //   contextual_images: false,
        // }],
        // sales_product_contents: [{
        //   additional_stock_image: false
        // }],
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
    handler: () => {/* not used to migrate only delete... *//*},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockAmenity',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... *//*},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockCondition',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... *//*},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockManufacturer',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... *//*},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockModel',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... *//*},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockStatus',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... *//*},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockType',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... *//*},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'stockUnit',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... *//*},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'locationStockPrice',
    type: 'entry',
    //@ts-ignore
    handler: () => {/* not used to migrate only delete... *//*},
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }
  */
]

export default {
  getEnvironmentVariables,
  migrationConfiguration
}