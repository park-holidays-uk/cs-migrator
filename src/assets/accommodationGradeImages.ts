import { CachedEntries, MigrationConfigurationType, ScraperCtx } from '../types';
import { getAllEntries, uploadFileToContentStack } from '../tools';
import { writeSync } from '../dataHandler/fileCache';

const tagReference = {
  accommodationGradeImages_ph: 'parkholidays',
  accommodationGradeImages_pl: 'parkleisure'
}

const imageFolder = {
  accommodationGradeImages_ph: {
    grade_media: 'blte4c4bf5a459c7cff',
    grade_type_media: 'bltaf7d8783d01f53f3',
  },
  accommodationGradeImages_pl: {
    grade_media: 'blt149e26dd72d31aeb',
    grade_type_media: 'blt798b299f5f2cf370',
  }
}

const uploadAccommodationGradeImagesFromLegacy = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const legacyAccommodationGrades = await getAllEntries(context, 'legacy', 'accommodation_grade');
  const imageCache = {};

  for (const grade of legacyAccommodationGrades) {
    if (!(grade['tags'] || []).includes(tagReference[migrationConfig.name])) {
      continue;
    }
    // Grade Images
    const gradeImages = grade['grade_contextual_images'] ?? [];
    for (const gImg of gradeImages) {
      if (imageCache[gImg.image.uid]) continue;
      const response = await uploadFileToContentStack(
        context,
        migrationConfig,
        gImg.image,
        imageFolder[migrationConfig.name].grade_media,
        [],
      )
      imageCache[gImg.image.uid] = response.uid;
    }
    context.cache[migrationConfig.name] = imageCache;

    // Contextual images based on Accommodation Type
    const gradeTypes = grade['media'] ?? [];
    for (const type of gradeTypes) {
      const contextualImages = type['contextual_images'] ?? [];
      for (const contextualImage of contextualImages) {
        if (imageCache[contextualImage.image.uid]) continue;
        const response = await uploadFileToContentStack(
          context,
          migrationConfig,
          contextualImage.image,
          imageFolder[migrationConfig.name].grade_type_media,
          [],
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

export { uploadAccommodationGradeImagesFromLegacy };
