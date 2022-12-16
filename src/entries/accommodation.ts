import { migrateAllEntriesForContentType } from '.';
import {
  CachedEntries,
  EntryObj,
  EntryPayload,
  MigrationConfigurationType,
  ScraperCtx,
} from '../types';
import { findCachedEntry, findImageRef, scrubExistingData, switchStackReferences } from '../tools';

const locationCache = {
  accommodation_ph: 'locationChild_ph',
  accommodation_pl: 'locationChild_pl',
};

const updateAccommodationInChild = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const createAccommodationBody = async (entry: EntryObj): Promise<EntryPayload> => {

    // Check to see if the accommodations location is in the correct brand
    const [_, locationUid] = findCachedEntry(
      context,
      {
        ...migrationConfig,
        cacheLookupKey: locationCache[migrationConfig.name],
      },
      entry['location']?.[0]?.['uid'],
      migrationConfig.stackName,
      locationCache[migrationConfig.name],
    );
    if (!locationUid) {
      return {
        entry: null,
      };
    }

    // create accommodation body
    let accommodation: EntryObj = switchStackReferences(context, entry, migrationConfig.stackName);

    accommodation['contextual_images'] = (accommodation['contextual_images'] ?? []).map(
      (contextualImage) => findImageRef(
        context,
        migrationConfig.stackName,
        'accommodationImages',
        contextualImage.image.uid,
      )
    );

    console.log('TCL: accommodation', JSON.stringify(accommodation));


    return {
      entry: null,
    };

    // return {
    //   entry: scrubExistingData(accommodation, { media_text_content: true }),
    // };
  };

  return await migrateAllEntriesForContentType(context, migrationConfig, createAccommodationBody);
};

export { updateAccommodationInChild };
