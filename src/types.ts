export type EnvironmentType = 'playground' | 'parkholidays'

export type FolderNameType = 'Park_Logo' | 'Location_Media' | 'Accommodation_Media'

export type MigrationConfigurationType = {
  name: MigrationType
  includeInMigration: boolean
  type: 'asset' | 'entry'
  handler: (context: any) => Promise<{}>
  folderName?: FolderNameType
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
