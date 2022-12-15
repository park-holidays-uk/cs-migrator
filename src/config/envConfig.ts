import dotenv from 'dotenv';
import {
  migrateAllEntriesForContentType,
  updateCreateLocationsInGlobal,
  updateFooterInChild,
  updateLocationsInChild,
} from '../entries';
import {
  uploadAccommodationGradeImagesFromLegacy,
  uploadLocationImagesFromLegacy,
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
    name: 'accommodationAmenity',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: false,
    scrubbedFields: { tags: true },
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'accomodationGradeImages_ph',
    type: 'asset',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: uploadAccommodationGradeImagesFromLegacy,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'accomodationGradeImages_pl',
    type: 'asset',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: uploadAccommodationGradeImagesFromLegacy,
    includeInRemove: false,
    includeInMigration: true,
    updateKeys: 'all',
  }, {
    name: 'accommodationType',
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
    name: 'associationLogos_ph',
    type: 'asset',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: () => {
      // not used to migrate -
      // associationLogos cache is hard coded
      // only used for reference switching
      return Promise.resolve({})
    },
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'associationLogos_pl',
    type: 'asset',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: () => {
      // not used to migrate -
      // associationLogos cache is hard coded
      // only used for reference switching
      return Promise.resolve({})
    },
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
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
    name: 'featuredLocation',
    contentUid: 'featured_location',
    type: 'entry',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
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
    name: 'footer',
    contentUid: 'footer',
    type: 'entry',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: updateFooterInChild,
    includeInRemove: false,
    includeInMigration: false, // This has been run for parkholidays and then parkleisure ->
    // Do not run again ideally. If so footer.json gets overwritten each time. Manually deleting incorrect records.
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
    includeInMigration: false,
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
    includeInMigration: false,
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
    name: 'navigationMenu',
    contentUid: 'navigation_menu',
    type: 'entry',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'navigationMenuPh',
    contentUid: 'navigation_menu_ph',
    type: 'entry',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'notificationType',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: false,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'priority',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
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
  }, {
    name: 'socialLogos_ph',
    type: 'asset',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: () => {
      // not used to migrate -
      // associationLogos cache is hard coded
      // only used for reference switching
      return Promise.resolve({})
    },
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'socialLogos_pl',
    type: 'asset',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: () => {
      // not used to migrate -
      // associationLogos cache is hard coded
      // only used for reference switching
      return Promise.resolve({})
    },
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'webpage',
    type: 'entry',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    handler: migrateAllEntriesForContentType,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }

  /*
     {
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