import { CachedEntries, MigrationConfigurationType, ScraperCtx } from '../types';
import { getAllEntries, uploadFileToContentStack } from '../tools';
import { writeSync } from '../dataHandler/fileCache';

const locationCache = {
  stockImages_legacy: 'locationChild_pl', // This is for (amble links) parkleisure -> legacy
  stockImages_pl: 'locationChild_pl',
};

const imageFolder = {
  stockImages_legacy: {
    stock_media: 'blt42c0f594f59eadea',
  },
  stockImages_pl: {
    stock_media: 'blt88a1aa5912db81ec',
  }
}

const uploadStockUnitImagesFromParkLeisure = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const parkLeisureStockUnits = await getAllEntries(context, 'parkleisure', 'stock_unit');
  const imageCache = context.cache[migrationConfig.name] ?? {};
  for (const stockUnit of parkLeisureStockUnits) {
    if (stockUnit.location?.[0]?.uid !== 'blt185531672cf01cc7') { // Chantry
      continue;
    }
    // Contextual images
    const contextualImages = stockUnit['contextual_images'] ?? [];
    for (const contextualImage of contextualImages) {
      if (!contextualImage.image?.uid || imageCache[contextualImage.image.uid]) {
        console.log('TCL: Image already exists...', contextualImage.image?.uid)
        continue;
      }
      if (Number.parseInt(contextualImage.image.file_size) > 5000000) {
        console.log('TCL: IMAGE TOO LARGE IMAGE TOO LARGE IMAGE TOO LARGE IMAGE TOO LARGE', contextualImage.image);
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


export { uploadStockUnitImagesFromParkLeisure };
