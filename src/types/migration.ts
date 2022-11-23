import type { PublishEnvironments, TargetStackName } from './apiConfig';

export type EnvironmentType = 'legacy';

export type ContentTypeType = 'global_fields' | 'content_types';

export type FolderNameType = 'Park_Logo' | 'Location_Media' | 'Accommodation_Media' | 'Stock_Media';

type UpdateKeyMapType = {
  [key: string]: boolean | UpdateKeyMapType | UpdateKeyMapType[];
};


export type MigrationConfigurationType = {
  name: MigrationType;
  contentUid?: string;
  type: 'asset' | 'entry';
  folderName?: FolderNameType;
  handler: (context: any, migrationConfig: MigrationConfigurationType) => Promise<{}>;
  includeInRemove: boolean;
  includeInMigration: boolean;
  stackName: TargetStackName;
  publishEnvironments: PublishEnvironments[]
  scrubbedFields?: { [key: string]: boolean };
  updateKeys: 'none' | 'all' | { entry: UpdateKeyMapType };
  removalTags?: string[];
};

export type MigrationType =
  | 'locationLogo'
  | 'locationGalleryHolidays'
  | 'locationGalleryTouring'
  | 'locationGalleryOwnership'
  | 'stockGallery'
  | 'accommodationGallery'
  | 'additionalStockGallery'
  | 'holidayProduct'
  | 'locationCategory'
  | 'locationAmenity'
  | 'region'
  | 'county'
  | 'webpage'
  | 'location'
  | 'accommodationType'
  | 'accommodationGrade'
  | 'accommodationAmenity'
  | 'accommodation'
  | 'stockAddon'
  | 'stockAmenity'
  | 'stockCondition'
  | 'stockManufacturer'
  | 'stockModel'
  | 'stockStatus'
  | 'stockType'
  | 'stockUnit'
  | 'locationStockPrice';
