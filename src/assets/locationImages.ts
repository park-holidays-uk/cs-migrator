import { CachedEntries, EntryObj, EntryPayload, MigrationConfigurationType, ScraperCtx } from '../types';
import { getAllEntries, uploadFileToContentStack } from '../tools';
import { writeSync } from '../dataHandler/fileCache';

const brandUids = {
  locationImages_ph: 'blt512eebdbfb8c0494',
  locationImages_pl: 'bltc5c6a2e0122d9bd7'
}

const imageFolder = {
  locationImages_ph: {
    location_media: 'blt7b7a37ad271f9579',
    park_logo: 'bltb0b2188489331a6d',
    sales_journey: 'blt655d4625a738e63b',
  },
  locationImages_pl: {
    location_media: 'bltbae861a9da7fa605',
    park_logo: 'blt43799d1f4ac28346',
    sales_journey: 'blt6e6a115199f385c4',
  }
}

const uploadLocationImagesFromLegacy = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const legacyLocations = await getAllEntries(context, 'legacy', 'location');
  const imageCache = {};

  for (const location of legacyLocations) {
    if (location['brand']?.[0]?.uid !== brandUids[migrationConfig.name]) {
      continue;
    }
    // Park Logo
    const response = await uploadFileToContentStack(
      context,
      migrationConfig,
      location['park_logo'].image,
      imageFolder[migrationConfig.name].park_logo,
    )
    imageCache[location['park_logo'].image.uid] = response.uid;
    context.cache[migrationConfig.name] = imageCache;

    // Holiday Products
    const holidayProducts = location['holiday_product_contents'] ?? [];
    for (const hp of holidayProducts) {
      const contextualImages = hp['contextual_images'] ?? [];
      for (const contextualImage of contextualImages) {
        const response = await uploadFileToContentStack(
          context,
          migrationConfig,
          contextualImage.image,
          imageFolder[migrationConfig.name].location_media,
        )
        imageCache[contextualImage.image.uid] = response.uid;
      }
    }
    context.cache[migrationConfig.name] = imageCache;

    // Sales Products
    const salesProducts = location['sales_product_contents'] ?? [];
    for (const sp of salesProducts) {
      const contextualImages = sp['contextual_images'] ?? [];
      for (const contextualImage of contextualImages) {
        const response = await uploadFileToContentStack(
          context,
          migrationConfig,
          contextualImage.image,
          imageFolder[migrationConfig.name].location_media,
        )
        imageCache[contextualImage.image.uid] = response.uid;
      }
      context.cache[migrationConfig.name] = imageCache;
      const bannerImages = ['wide_image', 'compact_image'];
      for (const bImg of bannerImages) {
        if (!sp['banner_images']?.[0]?.[bImg]) continue;
        const response = await uploadFileToContentStack(
          context,
          migrationConfig,
          sp['banner_images'][0][bImg],
          imageFolder[migrationConfig.name].sales_journey,
        )
        imageCache[sp['banner_images'][0][bImg].uid] = response.uid;
      }
      context.cache[migrationConfig.name] = imageCache;
      const mediaPages = sp['media_text_content']?.pages ?? [];
      for (const page of mediaPages) {
        const response = await uploadFileToContentStack(
          context,
          migrationConfig,
          page.image,
          imageFolder[migrationConfig.name].sales_journey,
        )
        imageCache[page.image.uid] = response.uid;
      }
      context.cache[migrationConfig.name] = imageCache;
      const additionalStockImages = sp['additional_stock_image']?.contextual_images ?? [];
      for (const contextualImage of additionalStockImages) {
        const response = await uploadFileToContentStack(
          context,
          migrationConfig,
          contextualImage.image,
          imageFolder[migrationConfig.name].location_media,
        )
        imageCache[contextualImage.image.uid] = response.uid;
      }
      context.cache[migrationConfig.name] = imageCache;
    }
    context.cache[migrationConfig.name] = imageCache;
    writeSync('legacy', 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])
  }
  return imageCache;
};

export { uploadLocationImagesFromLegacy };
