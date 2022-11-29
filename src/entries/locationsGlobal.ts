import { migrateAllEntriesForContentType } from '.';
import { CachedEntries, EntryObj, EntryPayload, MigrationConfigurationType, ScraperCtx } from '../types';
import { findCachedEntry, scrubExistingData, switchStackReferences } from '../tools';

const brandUids = {
  location_ph: 'blt512eebdbfb8c0494',
  location_pl: 'bltc5c6a2e0122d9bd7'
}

const updateCreateLocationsInGlobal = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const createLocationBody = async (entry: EntryObj): Promise<EntryPayload> => {
    if (entry['brand']?.[0]?.uid !== brandUids[migrationConfig.name]) {
      return  {
        entry: null,
      };
    }
    let location: EntryObj = switchStackReferences(context, entry, 'global')
    location = scrubExistingData(location, {
      // Cannot propogate images between stacks. Images must live at child stack level.
      contextual_images: true,
      banner_images: true,
      additional_stock_image: true,
      media_text_content: true,
      park_logo: true,
      image: true
    });
    delete location['park_logo']
    delete location['brand'];
    return {
      entry: location
    };
  }

  return await migrateAllEntriesForContentType(context, migrationConfig, createLocationBody);
};

export { updateCreateLocationsInGlobal };
