export type EnvironmentType = 'playground' | 'parkholidays'

export type ContentTypeType = 'global_fields' | 'content_types'

export type FolderNameType = 'Park_Logo' | 'Location_Media' | 'Accommodation_Media'

type UpdateKeyMapType = {
  [key: string]: boolean | UpdateKeyMapType | UpdateKeyMapType[]
}

export type MigrationConfigurationType = {
  name: MigrationType
  type: 'asset' | 'entry'
  folderName?: FolderNameType
  handler: (context: any, migrationConfig: MigrationConfigurationType) => Promise<{}>
  includeInRemove: boolean
  includeInMigration: boolean
  updateKeys: 'none' | 'all' | { entry: UpdateKeyMapType }
  removalTags?: string[]
}

export type MigrationType = 'locationLogo'
  | 'locationGalleryHolidays'
  | 'locationGalleryTouring'
  | 'locationGalleryOwnership'
  | 'accommodationGallery'
  | 'holidayProduct'
  | 'locationCategory'
  | 'locationAmenity'
  | 'region'
  | 'county'
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


