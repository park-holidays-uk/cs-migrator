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
    // const address = {
    //   ...entry['address'],
    //   region: switchStackReferences(context, entry['address']['region'], 'region', 'global'),
    //   county: switchStackReferences(context, entry['address']['county'], 'county', 'global'),
    // };
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
    //   address,
    //   location_category: switchStackReferences(context, entry['location_category'], 'locationCategory', 'global'),
    //   location_amenities: switchStackReferences(context, entry['location_amenities'], 'locationAmenities', 'global'),
    //   local_attractions: switchStackReferences(context, entry['local_attractions'], 'localAttractions', 'global'),
    //   holiday_product_contents: (entry['holiday_product_contents'] ?? []).map((holidayProduct) => {
    //     const hp = {...holidayProduct}
    //     hp.holiday_product = switchStackReferences(context, hp.holiday_product, 'holidayProduct', 'global'),
    //     hp.contextual_images = [];
    //     return hp;
    //   }),
    //   sales_product_contents: (entry['sales_product_contents'] ?? []).map((salesProduct) => {
    //     const sp = {...salesProduct}
    //     sp.contextual_images = [];
    //     sp.banner_images = [];
    //     sp.additional_stock_image.contextual_images = [];
    //     delete sp.media_text_content;
    //     return sp;
    //   })
    // };


    delete location['park_logo']

    console.log('TCL: location', location)
    delete location['brand'];

    return {
      entry: location
    };
  }

  return await migrateAllEntriesForContentType(context, migrationConfig, createLocationBody);
};

export { updateCreateLocationsInGlobal };
