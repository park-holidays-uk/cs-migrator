import { CachedEntries, MigrationConfigurationType, ScraperCtx } from '../types';
import { findCachedEntry, getAllEntries, uploadFileToContentStack } from '../tools';
import { writeSync } from '../dataHandler/fileCache';

const locationCache = {
  stockImages_ph: 'locationChild_ph',
  stockImages_pl: 'locationChild_pl',
};

const imageFolder = {
  stockImages_ph: {
    stock_media: 'bltb0e6bb02eb4abf65',
  },
  stockImages_pl: {
    stock_media: 'blt88a1aa5912db81ec',
  }
}

const uploadStockUnitImagesFromLegacy = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const legacyStockUnits = await getAllEntries(context, 'legacy', 'stock_unit');
  const imageCache = context.cache[migrationConfig.name] ?? {};
	console.log('TCL: imageCache', typeof imageCache, JSON.stringify(imageCache))

  for (const stockUnit of legacyStockUnits) {
    // Check to see if the accommodations location is in the correct brand
    const [_, locationUid] = findCachedEntry(
      context,
      {
        ...migrationConfig,
        cacheLookupKey: locationCache[migrationConfig.name],
      },
      stockUnit['location']?.[0]?.['uid'],
      migrationConfig.stackName,
      locationCache[migrationConfig.name],
    );
    if (!locationUid) {
      continue;
    }
    // Contextual images
    const contextualImages = stockUnit['contextual_images'] ?? [];
    for (const contextualImage of contextualImages) {
      if (!contextualImage.image?.uid || imageCache[contextualImage.image.uid]) {
        console.log('TCL: Image already exists...', contextualImage.image?.uid)
        continue;
      }
      const response = await uploadFileToContentStack(
        context,
        migrationConfig,
        contextualImage.image,
        imageFolder[migrationConfig.name].stock_media,
        [],
      )
      imageCache[contextualImage.image?.uid] = response.uid;
    }
    context.cache[migrationConfig.name] = imageCache;
    writeSync('legacy', 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])
  }
  return imageCache;
};

export { uploadStockUnitImagesFromLegacy };
