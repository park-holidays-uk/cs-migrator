export type EnvironmentType = 'playground' | 'parkholidays'

export type FolderNameType = 'Park_Logo' | 'Location_Media' | 'Accommodation_Media'

export type MigrationConfigurationType = {
  name: MigrationType
  type: 'asset' | 'entry'
  folderName?: FolderNameType
  handler: (context: any, migrationConfig: MigrationConfigurationType) => Promise<{}>
  includeInRemove: boolean
  includeInMigration: boolean
  shouldUpdate: boolean
}

export type MigrationType = 'locationLogos'
  | 'locationGalleries'
  | 'accommodationGalleries'
  | 'holidayProducts'
  | 'locationCategories'
  | 'locationAmenities'
  | 'regions'
  | 'counties'
  | 'locations'
  | 'accommodationTypes'
  | 'accommodationGrades'
  | 'accommodationAmenities'
  | 'accommodation'
