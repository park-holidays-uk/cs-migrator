import type { PublishEnvironments, StackName, TargetStackName } from './apiConfig';

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
  sourceStackName: StackName; // defaults to 'legacy'
  publishEnvironments: PublishEnvironments[];
  shouldCheckUpdatedAt: boolean;
  scrubbedFields?: { [key: string]: boolean };
  updateKeys: 'none' | 'all' | { entry: UpdateKeyMapType };
  removalTags?: string[];
};

export type MigrationConfigType = Omit<MigrationConfigurationType, 'sourceStackName'> & { sourceStackName?: StackName }

export type MigrationType =
  | 'accommodation_ph'
  | 'accommodation_pl'
  | 'accommodationImages_ph'
  | 'accommodationImages_pl'
  | 'accommodationAmenity'
  | 'accommodationGrade'
  | 'accommodationGrade_ph'
  | 'accommodationGrade_pl'
  | 'accommodationGradeImages_ph'
  | 'accommodationGradeImages_pl'
  | 'accommodationType'
  | 'associationLogos_ph'
  | 'associationLogos_pl'
  | 'county'
  | 'enquiryForm'
  | 'featuredLocation'
  | 'footer'
  | 'holidayProduct'
  | 'icon'
  | 'localAttraction'
  | 'location'
  | 'location_ph'
  | 'location_pl'
  | 'locationActivity'
  | 'locationAmenity'
  | 'locationCategory'
  | 'locationChild_ph'
  | 'locationChild_pl'
  | 'locationImages_ph'
  | 'locationImages_pl'
  | 'locationStockPrice'
  | 'navigationMenu'
  | 'navigationMenuPh'
  | 'notificationType'
  | 'priority'
  | 'redirects'
  | 'region'
  | 'socialLogos_ph'
  | 'socialLogos_pl'
  | 'stockAddon'
  | 'stockAddon_legacy'
  | 'stockAmenity'
  | 'stockAmenity_legacy'
  | 'stockCondition'
  | 'stockManufacturer'
  | 'stockModel'
  | 'stockStatus'
  | 'stockType'
  | 'stockImages_legacy'
  | 'stockImages_ph'
  | 'stockImages_pl'
  | 'stockUnit_legacy'
  | 'stockUnit_ph'
  | 'stockUnit_pl'
  | 'webpage'
