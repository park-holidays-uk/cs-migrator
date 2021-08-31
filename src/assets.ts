import {
  accommodationGradeQuery
} from './accommodationEntries'
import {
  apiDelay,
  createImageFolders,
  folderLookup,
  uploadAssets
} from './tools'


export const parkLogoQuery = (parkId) => `
  SELECT * FROM ph_db.media
  WHERE id in
  (
    SELECT media_id AS id FROM ph_db.media_lookups
    WHERE  media_lookup_tag LIKE '%logo%'
    AND media_lookup_type LIKE 'App_Models_Parks_Park'
    AND media_lookup_id=${parkId}
    ORDER BY media_lookup_order ASC
  );
`

export const uploadLocationLogos = async (context) => {
  const folderName = 'Park_Logo'
  const parks = await context.db.query(`
    SELECT id FROM parks;
  `)
  let responses = {}
  for (const park of parks) {
    const parkId = park.id
    const parkLogos = await context.db.query(parkLogoQuery(parkId))
    const thisResponse = await uploadAssets(context, parkLogos, folderName, folderLookup[folderName], (asset, response) => ({
      uid: response.asset.uid,
      filename: asset.path,
      parkId,
      folderName
    }))
    responses = {...responses, ...thisResponse}
  }
  return responses
}

export const locationGalleryQuery = (parkId, tagType: 'gallery' | 'video') => `
  SELECT * FROM ph_db.media
  WHERE id in
  (
    SELECT media_id AS id FROM ph_db.media_lookups
    WHERE media_lookup_type LIKE 'App_Models_Parks_Park'
    AND media_lookup_id=${parkId}
    AND (
      media_lookup_tag LIKE '%holidays_${tagType}%'
      OR media_lookup_tag LIKE '%touring_${tagType}%'
    )
    ORDER BY media_lookup_order ASC
  );
`

export const uploadLocationGalleries = async (context) => {
  const folder = 'Location_Media'
  const parks = await context.db.query(`
    SELECT id, name FROM parks LIMIT 2;
  `)

  let responses = {}
  for (const park of parks) {
    const parkId = park.id
    const { imageFolderUid, videoFolderUid } = await createImageFolders(context, folder, park.name)
    const locationGalleries = await context.db.query(locationGalleryQuery(parkId, 'gallery'))
    const imageUploadResponse = await uploadAssets(context, locationGalleries, `${folder}/images`, imageFolderUid, (asset, response) => ({
      uid: response.asset.uid,
      filename: asset.path,
      parkId,
      folder: `${folder}/images`
    }))
    // const locationVideos = await context.db.query(locationGalleryQuery(parkId, 'video'))
    // const videoUploadResponse = await uploadAssets(context, locationVideos, `${folder}/videos`, videoFolderUid, (asset, response) => ({
    //   uid: response.asset.uid,
    //   filename: asset.path,
    //   parkId,
    //   folder: `${folder}/videos`
    // }))
    responses = {...responses, ...imageUploadResponse}
  }
  return responses
}

export const accommodationGalleryQuery = (parkId, tagType: 'gallery' | 'video') => `
  SELECT * FROM ph_db.media
  WHERE id in
  (
    SELECT media_id AS id FROM ph_db.media_lookups
    WHERE media_lookup_type LIKE 'App_Models_Parks_Park'
    AND media_lookup_id=${parkId}
    AND (
      media_lookup_tag LIKE '%holidays_${tagType}%'
      OR media_lookup_tag LIKE '%touring_${tagType}%'
    )
    ORDER BY media_lookup_order ASC
  );
`



export const uploadAccommodationGalleries = async (context) => {
  const folder = 'Accommodation_Media'
	console.log("TCL: uploadAccommodationGalleries -> folder", folder)
  const parks = await context.db.query(`
    SELECT id, name FROM parks LIMIT 2;
  `)

  const accommodationGradeUids = {}
  const accommodationGrades = await context.db.query(accommodationGradeQuery())
  for (const grade of accommodationGrades) {
		console.log("TCL: uploadAccommodationGalleries -> grade", grade)
    await apiDelay(150)
    accommodationGradeUids[grade.id] = await createImageFolders(context, folder, grade.name)
  }

  let responses = {}
  for (const park of parks) {
    const parkId = park.id
		console.log("TCL: uploadAccommodationGalleries -> parkId", parkId)
    const hireTypes = await context.db.query(`
      SELECT * FROM ph_db.hire_types
      WHERE park_id=${parkId}
      AND deleted_at IS NULL
      LIMIT 2
      ORDER_BY grading_id; // want to use this to then group the asset uploads?? OR anopther nested loop???
    `)
		console.log("TCL: uploadAccommodationGalleries -> hireTypes", hireTypes)


    // const locationGalleries = await context.db.query(locationGalleryQuery(parkId, 'gallery'))
    // const imageUploadResponse = await uploadAssets(context, locationGalleries, `${folder}/images`, imageFolderUid, (asset, response) => ({
    //   uid: response.asset.uid,
    //   filename: asset.path,
    //   parkId,
    //   folder: `${folder}/images`
    // }))
    // // const locationVideos = await context.db.query(locationGalleryQuery(parkId, 'video'))
    // // const videoUploadResponse = await uploadAssets(context, locationVideos, `${folder}/videos`, videoFolderUid, (asset, response) => ({
    // //   uid: response.asset.uid,
    // //   filename: asset.path,
    // //   parkId,
    // //   folder: `${folder}/videos`
    // // }))
    // responses = {...responses, ...imageUploadResponse}
  }
  return responses
}