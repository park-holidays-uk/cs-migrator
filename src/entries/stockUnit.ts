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
  stockUnit_ph: 'locationChild_ph',
  stockUnit_pl: 'locationChild_pl',
};

const updateStockUnitInChild = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const createStockUnitBody = async (entry: EntryObj): Promise<EntryPayload> => {

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

		console.log('TCL: locationUid', locationUid)
    // create stock_unit body
    let stockUnit: EntryObj = switchStackReferences(context, entry, migrationConfig.stackName);
		console.log('TCL: stockUnit.title', stockUnit.title);

    stockUnit['contextual_images'] = (stockUnit['contextual_images'] ?? []).map(
      (contextualImage) => findImageRef(
        context,
        migrationConfig.stackName,
        'stockImages',
        contextualImage.image?.uid,
      )
    );
		console.log('TCL: stockUnit[contextual_images]', stockUnit['contextual_images'].length)

    return {
      entry: scrubExistingData(stockUnit),
    };
  };

  return await migrateAllEntriesForContentType(context, migrationConfig, createStockUnitBody);
};

export { updateStockUnitInChild };
