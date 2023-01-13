import { migrateAllEntriesForContentType } from '.';
import {
  CachedEntries,
  EntryObj,
  EntryPayload,
  MigrationConfigurationType,
  ScraperCtx,
} from '../types';
import { findImageRef, scrubExistingData, switchStackReferences } from '../tools';
import { switchStackParkCodes } from '../config/envConfig';

const brandUids = {
  parkholidays: 'blt512eebdbfb8c0494',
  parkleisure: 'bltc5c6a2e0122d9bd7',
};

const updateLocationsInChild = async (
  context: ScraperCtx,
  migrationConfig: MigrationConfigurationType,
): Promise<CachedEntries> => {
  const createLocationBody = async (entry: EntryObj): Promise<EntryPayload> => {
    // if (entry['brand']?.[0]?.uid !== brandUids[migrationConfig.stackName]) {
    //   return {
    //     entry: null,
    //   };
    // }
    if (!switchStackParkCodes.includes(entry['park_code'])) {
      return {
        entry: null,
      };
    }

    console.log('TCL: location', entry['park_code'], entry['uid']);

    return {
      entry: null,
    };

    let location: EntryObj = switchStackReferences(context, entry, migrationConfig.stackName);
    delete location['brand'];

    const parkLogo = findImageRef(
      context,
      migrationConfig.stackName,
      'locationImage',
      location['park_logo'].image.uid,
    );
    if (parkLogo) {
      location['park_logo'] = parkLogo;
    } else {
      delete location['park_logo'];
    }

    location['holiday_product_contents'] = (location['holiday_product_contents'] ?? []).map(
      (hp) => {
        hp['contextual_images'] = (hp['contextual_images'] ?? []).map((contextualImage) =>
          findImageRef(
            context,
            migrationConfig.stackName,
            'locationImage',
            contextualImage.image.uid,
          ),
        );
        return hp;
      },
    );

    location['sales_product_contents'] = (location['sales_product_contents'] ?? []).map((sp) => {
      sp['contextual_images'] = (sp['contextual_images'] ?? []).map((contextualImage) => {
        return findImageRef(
          context,
          migrationConfig.stackName,
          'locationImage',
          contextualImage.image.uid,
        );
      });
      sp['additional_stock_image']['contextual_images'] = (
        sp['additional_stock_image']['contextual_images'] ?? []
      ).map((contextualImage) =>
        findImageRef(
          context,
          migrationConfig.stackName,
          'locationImage',
          contextualImage.image.uid,
        ),
      );

      sp['banner_images'] = (sp['banner_images'] ?? []).map((bannerImg) => {
        const wideImage = findImageRef(
          context,
          migrationConfig.stackName,
          'locationImage',
          bannerImg.wide_image.uid,
        );
        const compactImage = findImageRef(
          context,
          migrationConfig.stackName,
          'locationImage',
          bannerImg.compact_image.uid,
        );
        return {
          ...(wideImage && { wide_image: wideImage.image }),
          ...(compactImage && { compact_image: compactImage.image }),
        };
      });
      return sp;
    });

    return {
      entry: scrubExistingData(location, { media_text_content: true }),
    };
  };

  return await migrateAllEntriesForContentType(context, migrationConfig, createLocationBody);
};

export { updateLocationsInChild };
