import { migrateAllEntriesForContentType } from './';
import { CachedEntries, EntryObj, EntryPayload, MigrationConfigurationType, ScraperCtx } from '../types';

const updateCreateLocations = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const createLocationBody = async (entry: EntryObj): Promise<EntryPayload> => {
    const address = { ...entry['address'] };
		console.log('TCL: address', address)
    const location = {
      ...entry
    };
    console.log('TCL: location', location)
    delete location['brand'];

    return {
      entry: {
        ...location,
      },
    };
  }

  return await migrateAllEntriesForContentType(context, migrationConfig, createLocationBody);
};

export { updateCreateLocations };
