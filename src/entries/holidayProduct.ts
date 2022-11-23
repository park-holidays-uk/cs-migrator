import { migrateContentType } from '../migration';
import { CachedEntries, MigrationConfigurationType, ScraperCtx } from '../types';

const createHolidayProducts = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  return await migrateContentType(context, migrationConfig);
};

export { createHolidayProducts };
