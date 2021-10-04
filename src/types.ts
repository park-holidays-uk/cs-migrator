export type EnvironmentType = 'playground' | 'parkholidays'

export type ContentTypeType = 'global_fields' | 'content_types'

export type FolderNameType = 'Park_Logo' | 'Location_Media' | 'Accommodation_Media'

type UpdateKeyMapType = {
  [key: string]: boolean | UpdateKeyMapType
}

export type MigrationConfigurationType = {
  name: MigrationType
  type: 'asset' | 'entry'
  folderName?: FolderNameType
  handler: (context: any, migrationConfig: MigrationConfigurationType) => Promise<{}>
  includeInRemove: boolean
  includeInMigration: boolean
  updateKeys: 'none' | 'all' | { entry: UpdateKeyMapType }
}

export type MigrationType = 'locationLogo'
  | 'locationGallery'
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