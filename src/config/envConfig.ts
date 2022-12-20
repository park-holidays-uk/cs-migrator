import dotenv from 'dotenv';
import {
  migrateAllEntriesForContentType,
  updateAccommodationGradeInChild,
  updateAccommodationInChild,
  updateCreateLocationsInGlobal,
  updateFooterInChild,
  updateLocationsInChild,
  updateStockModel,
  updateStockUnitInChild,
} from '../entries';
import {
  uploadAccommodationGradeImagesFromLegacy,
  uploadAccommodationImagesFromLegacy,
  uploadLocationImagesFromLegacy,
  uploadStockUnitImagesFromLegacy,
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
    name: 'accommodation_ph',
    contentUid: 'accommodation',
    type: 'entry',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    scrubbedFields: { tags: true },
    handler: updateAccommodationInChild,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'accommodation_pl',
    contentUid: 'accommodation',
    type: 'entry',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    scrubbedFields: { tags: true },
    handler: updateAccommodationInChild,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'accommodationImages_ph',
    type: 'asset',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: uploadAccommodationImagesFromLegacy,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'accommodationImages_pl',
    type: 'asset',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: uploadAccommodationImagesFromLegacy,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
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
    name: 'accommodationGrade',
    type: 'entry',
    contentUid: 'accommodation_grade',
    stackName: 'global', // Not actually used - only used for manually merged cache object
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: () => {
      // not used to migrate -
      // location cache is made up from combining location_ph && location_pl data
      // only used for reference switching and or deleting locations
      return Promise.resolve({})
    },
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'accommodationGrade_ph',
    type: 'entry',
    contentUid: 'accommodation_grade',
    cacheLookupKey: 'accommodationGrade',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    scrubbedFields: { tags: true },
    handler: updateAccommodationGradeInChild,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'accommodationGrade_pl',
    type: 'entry',
    contentUid: 'accommodation_grade',
    cacheLookupKey: 'accommodationGrade',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    scrubbedFields: { tags: true },
    handler: updateAccommodationGradeInChild,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'accommodationGradeImages_ph',
    type: 'asset',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: uploadAccommodationGradeImagesFromLegacy,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'accommodationGradeImages_pl',
    type: 'asset',
    stackName: 'parkleisure',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: uploadAccommodationGradeImagesFromLegacy,
    includeInRemove: false,
    includeInMigration: false,
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
  }, {
    name: 'stockAddon',
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
    name: 'stockAmenity',
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
    name: 'stockCondition',
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
    name: 'stockManufacturer',
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
    name: 'stockModel',
    type: 'entry',
    stackName: 'global',
    publishEnvironments: globalAllEnvironments,
    shouldCheckUpdatedAt: true,
    scrubbedFields: { tags: true },
    handler: updateStockModel,
    includeInRemove: false,
    includeInMigration: true,
    updateKeys: 'all',
  }, {
    name: 'stockStatus',
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
    name: 'stockType',
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
    name: 'stockImages_ph',
    type: 'asset',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: false,
    handler: uploadStockUnitImagesFromLegacy,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }, {
    name: 'stockUnit_ph',
    contentUid: 'stock_unit',
    type: 'entry',
    stackName: 'parkholidays',
    publishEnvironments: localEnvironments,
    shouldCheckUpdatedAt: true,
    scrubbedFields: { tags: true },
    handler: updateStockUnitInChild,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'all',
  }
]

export default {
  getEnvironmentVariables,
  migrationConfiguration
}