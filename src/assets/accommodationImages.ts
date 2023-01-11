import { CachedEntries, MigrationConfigurationType, ScraperCtx } from '../types';
import { findCachedEntry, getAllEntries, uploadFileToContentStack } from '../tools';
import { writeSync } from '../dataHandler/fileCache';

const locationCache = {
  accommodationImages_ph: 'locationChild_ph',
  accommodationImages_pl: 'locationChild_pl',
};

const imageFolder = {
  accommodationImages_ph: {
    accommodation_media: 'blt9e5694750a4d59e2',
  },
  accommodationImages_pl: {
    accommodation_media: 'bltbbacf5f7c3edb17f',
  }
}

const uploadAccommodationImagesFromLegacy = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const legacyAccommodation = await getAllEntries(context, 'legacy', 'accommodation');
  const imageCache = context.cache[migrationConfig.name] ?? {};

  for (const accommodation of legacyAccommodation) {
    // Check to see if the accommodations location is in the correct brand
    const [_, locationUid] = findCachedEntry(
      context,
      {
        ...migrationConfig,
        cacheLookupKey: locationCache[migrationConfig.name],
      },
      accommodation['location']?.[0]?.['uid'],
      migrationConfig.stackName,
      locationCache[migrationConfig.name],
    );
    if (!locationUid) {
      continue;
    }
    // Contextual images
    const contextualImages = accommodation['contextual_images'] ?? [];
    for (const contextualImage of contextualImages) {
      if (imageCache[contextualImage.image.uid]) continue;
      const response = await uploadFileToContentStack(
        context,
        migrationConfig,
        contextualImage.image,
        imageFolder[migrationConfig.name].accommodation_media,
        [],
      )
      imageCache[contextualImage.image.uid] = response.uid;
    }
    context.cache[migrationConfig.name] = imageCache;
    writeSync('legacy', 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])
  }
  return imageCache;
};

export { uploadAccommodationImagesFromLegacy };
