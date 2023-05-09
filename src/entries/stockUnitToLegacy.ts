import { jsonToHtml } from "@contentstack/json-rte-serializer";
import {
  CachedEntries,
  CreateBody,
  EntryObj,
  EntryPayload,
  MigrationConfigurationType,
  ScraperCtx,
  TargetStackName,
} from '../types';
import {
  arrayToKeyedObject,
  createEntries,
  findCachedEntry,
  findImageRef,
  getAllEntries,
  scrubExistingData,
  snakeCase,
  switchStackReferences,
} from '../tools';
import { migrateAllEntriesForContentTypeToLegacy } from './genericContentTypeToLegacy';

const locationCache = {
  stockUnit_ph: 'locationChild_ph',
  stockUnit_pl: 'locationChild_pl',
};

/* This is a one off to migrate Amble Links into legacy stack from park leisure */
const updateStockUnitInLegacy = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const createStockUnitBody = async (entry: EntryObj): Promise<EntryPayload> => {
    // Check to see if the Stock Units location is Malvern View
    if (entry.location?.[0]?.uid !== 'blt74a622f259405e81') {
      return {
        entry: null,
      };
    }
    // create stock_unit body
    let stockUnit: EntryObj = switchStackReferences(
      context,
      entry,
      'legacy' as TargetStackName,
      'parkleisure',
    );

    delete stockUnit.description.json_long_description;

    stockUnit.was_price = Number.parseInt(stockUnit.was_price ?? 0);

    stockUnit['contextual_images'] = (stockUnit['contextual_images'] ?? []).map(
      (contextualImage) => findImageRef(
        context,
        migrationConfig.stackName,
        'stockImages',
        contextualImage.image?.uid,
      )
    );
    return {
      entry: scrubExistingData(stockUnit),
    };
  };

  return await migrateAllEntriesForContentTypeToLegacy(
    context,
    migrationConfig,
    createStockUnitBody,
    (entry) => entry.location?.[0]?.uid === 'blt74a622f259405e81', // Malvern View
  );
};

export { updateStockUnitInLegacy };
