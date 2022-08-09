import dotenv from 'dotenv';
import { uploadAccommodationGalleries } from '../assets/galleries';
import {
  createAccommodationAmenities
} from '../entries/accommodationAmenities';
import { createAccommodation } from '../entries/accommodationEntries';
import { createAccommodationGrades } from '../entries/accommodationGrades';
import { PL_SCRAPED } from '../tools';
import { EnvironmentType, MigrationConfigurationType } from '../types';
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

const dummyAddEntries = () => Promise.resolve<any>({})

export const migrationConfiguration: MigrationConfigurationType[] = [{
    name: 'accommodationGallery',
    type: 'asset',
    handler: uploadAccommodationGalleries,
    folderName: 'Accommodation_Media',
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none', // images cannot update - always 'none'
    removalTags: [PL_SCRAPED],
  }, {

  //   name: 'additionalStockGallery',
  //   type: 'asset',
  //   handler: additionalStockGalleries,
  //   folderName: 'Location_Media',
  //   includeInRemove: false,
  //   includeInMigration: false,
  //   updateKeys: 'none', // images cannot update - always 'none'
  //   removalTags: ['additional_stock'],
//  {
    name: 'location',
    type: 'entry',
    handler: dummyAddEntries,
    includeInRemove: false,
    includeInMigration: false,
    updateKeys: 'none',
  }, {
    name: 'holidayProduct',
    type: 'entry',
    handler: dummyAddEntries,
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
    name: 'accommodationType',
    type: 'entry',
    handler: dummyAddEntries,
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
    includeInMigration: true,
    updateKeys: {
      entry: { // This will only update the truthy keys. everything else left as is.
        pets_allowed: false,
        accessible: false,
        accommodation_amenities: false,
        contextual_images: false,
      }
    },
  }
]

export default {
  getEnvironmentVariables,
  migrationConfiguration
}