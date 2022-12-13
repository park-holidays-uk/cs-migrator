import type { PublishEnvironments, TargetStackName } from './apiConfig';

export type EnvironmentType = 'legacy' | 'parkholidays';

export type ContentTypeType = 'global_fields' | 'content_types';

export type FolderNameType = 'Park_Logo' | 'Location_Media' | 'Accommodation_Media' | 'Stock_Media';

type UpdateKeyMapType = {
  [key: string]: boolean | UpdateKeyMapType | UpdateKeyMapType[];
};


export type MigrationConfigurationType = {
  name: MigrationType;
  cacheLookupKey?: string; // defaults to name
  // used by migrations like locationChild_ph - allows you to override findCachedEntry.cacheKey
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
  | 'location'
  | 'location_ph'
  | 'location_pl'
  | 'locationAmenity'
  | 'locationCategory'
  | 'locationChild_ph'
  | 'locationChild_pl'
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
