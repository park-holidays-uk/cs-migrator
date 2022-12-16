import { migrateAllEntriesForContentType } from '.';
import {
  CachedEntries,
  EntryObj,
  EntryPayload,
  MigrationConfigurationType,
  ScraperCtx,
} from '../types';
import { findImageRef, scrubExistingData, switchStackReferences } from '../tools';

const tagReference = {
  accommodationGrade_ph: 'parkholidays',
  accommodationGrade_pl: 'parkleisure',
};

const updateAccommodationGradeInChild = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const createAccommodationGradeBody = async (entry: EntryObj): Promise<EntryPayload> => {
    if (!(entry['tags'] || []).includes(tagReference[migrationConfig.name])) {
      return {
        entry: null,
      };
    }

    let grade: EntryObj = switchStackReferences(context, entry, migrationConfig.stackName);

    // Grade Images
    grade['grade_contextual_images'] = (grade['grade_contextual_images'] ?? []).map((gImg) =>
      findImageRef(context, migrationConfig.stackName, 'accommodationGradeImages', gImg.image.uid)
    );

    // Contextual images based on Accommodation Type
    grade['media'] = (grade['media'] ?? []).map((gradeType) => ({
      ...gradeType,
      contextual_images: (gradeType['contextual_images'] ?? []).map((contextualImage) =>
        findImageRef(
          context,
          migrationConfig.stackName,
          'accommodationGradeImages',
          contextualImage.image.uid,
        ),
      ),
    }));

    return {
      entry: scrubExistingData(grade),
    };
  };

  return await migrateAllEntriesForContentType(
    context,
    migrationConfig,
    createAccommodationGradeBody,
  );
};

export { updateAccommodationGradeInChild };
