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
  publishEnvironments: PublishEnvironments[];
  shouldCheckUpdatedAt: boolean;
  scrubbedFields?: { [key: string]: boolean };
  updateKeys: 'none' | 'all' | { entry: UpdateKeyMapType };
  removalTags?: string[];
};

export type MigrationType =
  | 'accommodation'
  | 'accommodationAmenity'
  | 'accommodationGrade'
  | 'accommodationType'
  | 'county'
  | 'enquiryForm'
  | 'holidayProduct'
  | 'icon'
  | 'location_ph'
  | 'location_pl'
  | 'locationAmenity'
  | 'locationCategory'
  | 'locationImages_ph'
  | 'locationImages_pl'
  | 'locationStockPrice'
  | 'navigation'
  | 'redirects'
  | 'region'
  | 'stockAddon'
  | 'stockAmenity'
  | 'stockCondition'
  | 'stockGallery'
  | 'stockManufacturer'
  | 'stockModel'
  | 'stockStatus'
  | 'stockType'
  | 'stockUnit'
  | 'webpage';
