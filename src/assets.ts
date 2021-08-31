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
  SELECT m.id, m.path, m.description, ml.media_lookup_order FROM ph_db.media as m
  INNER JOIN ph_db.media_lookups as ml
  WHERE m.id = ml.media_id
  AND ml.media_lookup_tag LIKE '%logo%'
  AND ml.media_lookup_type LIKE 'App_Models_Parks_Park'
  AND ml.media_lookup_id=${parkId}
  ORDER BY ml.media_lookup_order ASC
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
    const thisResponse = await uploadAssets(context, parkLogos, `${folderName} ${parkId}`, folderLookup[folderName], (asset, response) => ({
      uid: response.asset.uid,
      filename: asset.path,
      parkId,
      folderName
    }))
    responses = {...responses, ...thisResponse}
  }
  return responses
}

export const locationGalleryQuery = (parkId, tagType: 'gallery' | 'video', sector: 'holidays' | 'touring' | 'all') => `
  SELECT m.id, m.path, m.description, ml.media_lookup_order FROM ph_db.media as m
  INNER JOIN ph_db.media_lookups as ml
  WHERE m.id = ml.media_id
  AND ml.media_lookup_type LIKE 'App_Models_Parks_Park'
  AND ml.media_lookup_id=${parkId}
  ${sector === 'all'
    ? `
        AND (
          ml.media_lookup_tag LIKE '%holidays_${tagType}%'
          OR ml.media_lookup_tag LIKE '%touring_${tagType}%'
        )
      `
    : `AND ml.media_lookup_tag LIKE '%${sector}_${tagType}%'`
  }
  ORDER BY ml.media_lookup_order ASC;
`

export const uploadLocationGalleries = async (context) => {
  const folder = 'Location_Media'
  const parks = await context.db.query(`
    SELECT id, name FROM parks;
  `)

  let responses = {}
  for (const park of parks) {
    const parkId = park.id
    const { imageFolderUid } = await createImageFolders(context, folder, park.name)
    const locationGalleries = await context.db.query(locationGalleryQuery(parkId, 'gallery', 'all'))
    const imageUploadResponse = await uploadAssets(context, locationGalleries, `${folder}/images`, imageFolderUid, (asset, response) => ({
      uid: response.asset.uid,
      filename: asset.path,
      parkId,
      folder: `${folder}/images`
    }))
    responses = {...responses, ...imageUploadResponse}
  }
  return responses
}

export const accommodationGalleryQuery = (accommodationId) => `
  SELECT m.id, m.path, m.description, ml.media_lookup_order FROM ph_db.media as m
  INNER JOIN ph_db.media_lookups as ml
  WHERE m.id = ml.media_id
  AND ml.media_lookup_type LIKE 'App_Models_HireType'
  AND ml.media_lookup_tag LIKE '%gallery%'
  AND ml.media_lookup_id=${accommodationId}
  ORDER BY ml.media_lookup_order ASC
`

export const uploadAccommodationGalleries = async (context) => {
  const folder = 'Accommodation_Media'
  const parks = await context.db.query(`
    SELECT id, name FROM parks;
  `)

  const accommodationGradeUids = {}
  const accommodationGrades = await context.db.query(accommodationGradeQuery())
  for (const grade of accommodationGrades) {
    await apiDelay(150)
    const folderUids = await createImageFolders(context, folder, grade.name)
    accommodationGradeUids[grade.id] = {
      ...folderUids,
      parentFolderName: grade.name
    }
  }
  await apiDelay(150)
  const pitchImages = 'Touring Pitches'
  const folderUids = await createImageFolders(context, folder, pitchImages)
  accommodationGradeUids[0] = {
    ...folderUids,
    parentFolderName: pitchImages
  }

  let responses = {}
  for (const park of parks) {
    const parkId = park.id
    const hireTypesWithImages = await context.db.query(`
      SELECT DISTINCT ht.id, ht.grading_id, ht.code FROM ph_db.hire_types as ht
      INNER JOIN ph_db.media_lookups as ml
      WHERE ht.park_id=${parkId}
      AND ml.media_lookup_type LIKE 'App_Models_HireType'
      AND ml.media_lookup_tag LIKE 'Gallery'
      AND ml.media_lookup_id = ht.id
      AND ht.deleted_at IS NULL
      ORDER BY grading_id;
    `)

    const hireTypesByGradeId = hireTypesWithImages.reduce((acc, hireType) => {
      if (!acc[hireType.grading_id]) acc[hireType.grading_id] = []
      acc[hireType.grading_id].push(hireType)
      return acc
    }, {})

    const gradeKeys = Object.keys(hireTypesByGradeId)
    for (const gradeKey of gradeKeys) {
      if (gradeKey === 'null') continue
      const { imageFolderUid, parentFolderName } = accommodationGradeUids[gradeKey]
      for (const hireType of hireTypesByGradeId[gradeKey]) {
        let accommodationGalleries = await context.db.query(accommodationGalleryQuery(hireType.id))
        accommodationGalleries = accommodationGalleries.filter((ag) => {
				  return !responses[ag.id]
        })
        if (accommodationGalleries.length) {
          const imageUploadResponse = await uploadAssets(context, accommodationGalleries, `${parentFolderName}/images`, imageFolderUid, (asset, response) => ({
            uid: response.asset.uid,
            filename: asset.path,
            grade: gradeKey,
            accommodationId: hireType.id,
            parkId,
            folder: `${parentFolderName}/images`
          }))
          responses = {...responses, ...imageUploadResponse}
        }
      }
    }
  }
  return responses
}

