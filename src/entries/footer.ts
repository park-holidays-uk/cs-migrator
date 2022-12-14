import { migrateAllEntriesForContentType } from '.';
import {
  CachedEntries,
  EntryObj,
  EntryPayload,
  MigrationConfigurationType,
  ScraperCtx,
} from '../types';
import { findImageRef, scrubExistingData, switchStackReferences } from '../tools';

const updateFooterInChild = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {

  const createFooterBody = async (entry: EntryObj): Promise<EntryPayload> => {
    const footer: EntryObj = switchStackReferences(context, entry, migrationConfig.stackName);
    footer['social_media'] = {
      group: footer['social_media']['group'].map((socialItem) => {
        const logoRef = findImageRef(
          context,
          migrationConfig.stackName,
          'socialLogo',
          socialItem['logo'].uid,
        );
        return {
          ...socialItem,
          logo: logoRef?.image ?? ''
        }
      })
    }
    footer['awards_recognitions'] = {
      group: footer['awards_recognitions']['group'].map((awardItem) => {
        const logoRef = findImageRef(
          context,
          migrationConfig.stackName,
          'awardLogo',
          awardItem['logo'].uid,
        );
        return {
          ...awardItem,
          logo: logoRef?.image ?? ''
        }
      })
    }
    return {
      entry: scrubExistingData(footer, { media_text_content: true }),
    };
  };

  return await migrateAllEntriesForContentType(context, migrationConfig, createFooterBody);
};

export { updateFooterInChild };
