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

    let footer: EntryObj = switchStackReferences(context, entry, migrationConfig.stackName);
		console.log('TCL: footer', JSON.stringify(footer))


    // const parkLogo = findImageRef(
    //   context,
    //   migrationConfig.stackName,
    //   'locationImage',
    //   location['park_logo'].image.uid,
    // );
    // if (parkLogo) {
    //   location['park_logo'] = parkLogo;
    // } else {
    //   delete location['park_logo'];
    // }

    // location['holiday_product_contents'] = (location['holiday_product_contents'] ?? []).map(
    //   (hp) => {
    //     hp['contextual_images'] = (hp['contextual_images'] ?? []).map((contextualImage) =>
    //       findImageRef(
    //         context,
    //         migrationConfig.stackName,
    //         'locationImage',
    //         contextualImage.image.uid,
    //       ),
    //     );
    //     return hp;
    //   },
    // );

    // location['sales_product_contents'] = (location['sales_product_contents'] ?? []).map((sp) => {
    //   sp['contextual_images'] = (sp['contextual_images'] ?? []).map((contextualImage) => {
    //     return findImageRef(
    //       context,
    //       migrationConfig.stackName,
    //       'locationImage',
    //       contextualImage.image.uid,
    //     );
    //   });
    //   sp['additional_stock_image']['contextual_images'] = (
    //     sp['additional_stock_image']['contextual_images'] ?? []
    //   ).map((contextualImage) =>
    //     findImageRef(
    //       context,
    //       migrationConfig.stackName,
    //       'locationImage',
    //       contextualImage.image.uid,
    //     ),
    //   );

    //   sp['banner_images'] = (sp['banner_images'] ?? []).map((bannerImg) => {
    //     const wideImage = findImageRef(
    //       context,
    //       migrationConfig.stackName,
    //       'locationImage',
    //       bannerImg.wide_image.uid,
    //     );
    //     const compactImage = findImageRef(
    //       context,
    //       migrationConfig.stackName,
    //       'locationImage',
    //       bannerImg.compact_image.uid,
    //     );
    //     return {
    //       ...(wideImage && { wide_image: wideImage.image }),
    //       ...(compactImage && { compact_image: compactImage.image }),
    //     };
    //   });
    //   return sp;
    // });

    return {
      entry: scrubExistingData(footer, { media_text_content: true }),
    };
  };

  // return await migrateAllEntriesForContentType(context, migrationConfig, createFooterBody);
};

export { updateFooterInChild };
