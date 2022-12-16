import { migrateAllEntriesForContentType } from '.';
import {
  CachedEntries,
  EntryObj,
  EntryPayload,
  MigrationConfigurationType,
  ScraperCtx,
} from '../types';
import { scrubExistingData, switchStackReferences } from '../tools';

const updateStockModel = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const createStockModelBody = async (entry: EntryObj): Promise<EntryPayload> => {

    const stockModel: EntryObj = switchStackReferences(context, entry, migrationConfig.stackName);
    return {
      entry: scrubExistingData(stockModel),
    };
  };

  return await migrateAllEntriesForContentType(context, migrationConfig, createStockModelBody);
};

export { updateStockModel };
