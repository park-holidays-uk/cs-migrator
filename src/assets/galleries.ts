import { getAccommodationEntries } from '../entries/accommodationEntries';
import {
  getAllAssets, getFolderUid,
  PL_SCRAPED,
  updateAssetTags,
  uploadAssets
} from '../tools';


const fetchAllFileNames = async (context, folderUid) => {
  const allAssets = await getAllAssets(context, folderUid);
  return allAssets.reduce((acc, asset) => ({
    ...acc,
    [asset.filename]: {
      uid: asset.uid,
      description: asset.description,
      tags: asset.tags,
    },
  }), {});
};

export const uploadAccommodationGalleries = async (context, migrationConfig) => {

  const accommodationEntries = (await getAccommodationEntries(
    context
  ));

  const getFilename = (imageId) => context.db.query(`
    SELECT id, filename FROM craft_assetfiles
    WHERE sourceId=1 AND id=${imageId};
  `);

  const folderUid = getFolderUid(context.env, 'Accommodation_Media');
  const uniqueFileNames = await fetchAllFileNames(context, folderUid);
  // 41 - accommodation_images
  // 46 - card image
  // 50 - tile image

  // tags: [
    // 56; -- accomm grade (findCachedEntry)
    // ??  -- accom type (caravan / lodge etc) (entryType - glamping / cottage / holiday home etc.. )
    // 52; -- accomm grade code
    // 57; -- park (findCachedEntry)
    // 'parkleisure'
  // ]
  let responses = {};
  for (const entry of accommodationEntries) {
    const accomGradeCode = entry.fields['52'];
    const accomGrade =  context.cache['accommodationGrade']?.[entry.fields['56']?.[0]]?.title ?? '';
    const accomType = context.cache['accommodationType']?.[entry.entryType]?.title ?? entry.entryType;
    const parkName = context.cache['location']?.[entry.fields['57']?.[0]]?.title ?? '';
    const description = `${accomGradeCode} ${accomType}`
    const tags = [
      PL_SCRAPED,
      accomGradeCode,
      parkName,
      accomGrade,
      accomType,
    ]

    const imageIds = entry.fields['41'] ?? [];
    const filenames = await Promise.all(imageIds.map((imgId) => getFilename(imgId)));

    const [ imagesToUpdate, imagesToUpload ] = filenames.reduce((acc, [{ id, filename }]) => {
      const existingAsset = uniqueFileNames[filename];
      const asset = {
        id,
        filename,
        path: `https://parkleisureholidays.fra1.cdn.digitaloceanspaces.com/assets/${filename}`,
        description,
      }
      if (existingAsset) {
        acc[0].push({
          ...asset,
          ...existingAsset,
        });
      } else {
        acc[1].push(asset);
      }
      return acc;
    }, [[], []]);

    for (const assetToUpdate of imagesToUpdate) {
      const mergedTags = new Set<string>();
      assetToUpdate.tags.forEach((t) => mergedTags.add(t));
      tags.forEach((t) => mergedTags.add(t));
      const response = await updateAssetTags(context, assetToUpdate, Array.from(mergedTags));
      responses = {
        ...responses,
        [assetToUpdate.id]: {
          uid: response.asset.uid,
          filename: response.asset.filename,
          imageId: assetToUpdate.id,
          accommodationType: accomType,
          parkName,
        }
      }
    }

    const imageUploadResponse = await uploadAssets(context, imagesToUpload, entry.title, folderUid, tags, (asset, response) => ({
      uid: response.asset.uid,
      filename: asset.filename,
      imageId: entry.entryId,
      accommodationType: entry.entryType,
      parkName,
    }));
    responses = {...responses, ...imageUploadResponse}

    // Keep uniqueFileNames up to date as you add more assets..
    Object.keys(imageUploadResponse).forEach((newAsset) => {
      if (!imageUploadResponse[newAsset].filename) return
      uniqueFileNames[imageUploadResponse[newAsset].filename] = {
        uid: imageUploadResponse[newAsset].uid,
        description,
        tags
      };
    })

  }
  return responses;
};
