import { migrateAllEntriesForContentType } from './';
import { CachedEntries, MigrationConfigurationType, ScraperCtx } from '../types';

const createHolidayProducts = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  return await migrateAllEntriesForContentType(context, migrationConfig);
};

export { createHolidayProducts };
