import {
  accommodationGradeQuery
} from '../entries/accommodationEntries'
import {
  getFolderUid,
  uploadAssets
} from '../tools'


export const parkLogoQuery = (parkId) => `
  SELECT m.id, m.path, m.description, ml.media_lookup_order FROM ph_db.media as m
  INNER JOIN ph_db.media_lookups as ml
  WHERE m.id = ml.media_id
  AND ml.media_lookup_tag LIKE '%logo%'
  AND ml.media_lookup_type LIKE 'App_Models_Parks_Park'
  AND ml.media_lookup_id=${parkId}
  ORDER BY ml.media_lookup_order ASC
`

export const UNIQUE_PARK_QUERY = 'SELECT id, name FROM parks WHERE deleted_at IS NULL;'

export const uploadLocationLogos = async (context, migrationConfig) => {
  const folderName = 'Park_Logo'
  const parks = await context.db.query(UNIQUE_PARK_QUERY)
  let responses = {}
  for (const park of parks) {
    const parkId = park.id
    const parkLogos = await context.db.query(parkLogoQuery(parkId))
    const [newParkLogos, existingParkLogos] = parkLogos.reduce((acc, logo) => {
      acc[context.cache[migrationConfig.name][logo.id] ? 1 : 0].push(logo)
      return acc
    }, [[], []])

    if (newParkLogos.length) {
      const folderUid = getFolderUid(context.env, folderName)
      const thisResponse = await uploadAssets(context, newParkLogos, `${folderName} ${parkId}`, folderUid, [], (asset, response) => ({
        uid: response.asset.uid,
        filename: asset.path,
        parkId,
        folderName
      }))
      responses = {...responses, ...thisResponse}
    }
    if (existingParkLogos.length) {
      if (migrationConfig.shouldUpdate) {
        console.log('\n\nCurrently migration does not handle updating assets. Need to DELETE/CREATE')
        /*
        * Legacy images will always be under a new id. So no need for updating content of image.
        * Also uploading a new asset creates a new contentstack uid - which entries have reference to.
        * Larger task than warrants the effort. Currently adding new images seems sufficient.
        */
      }
      responses = {...responses, ...context.cache[migrationConfig.name]}
    }
  }
  return responses
}

// 'all' existed before ownership - so only combines holidays & touring.
// Never updated during sales journey as updating images is not possible, allocates new uid.
export type LocationGallerySectorType = 'holidays' | 'touring' | 'ownership'

export const locationGalleryQuery = (parkId, tagType: 'gallery' | 'video', sector: LocationGallerySectorType) => `
  SELECT m.id, m.path, m.description, ml.media_lookup_order FROM ph_db.media as m
  INNER JOIN ph_db.media_lookups as ml
  WHERE m.id = ml.media_id
  AND ml.media_lookup_type LIKE 'App_Models_Parks_Park'
  AND ml.media_lookup_id=${parkId}
  AND ml.media_lookup_tag LIKE '%${sector}_${tagType}%'
  ORDER BY ml.media_lookup_order ASC;
`

export const uploadLocationGalleries = async (context, migrationConfig, galleryType: LocationGallerySectorType, tags = []) => {
  const folder = 'Location_Media'
  const parks = await context.db.query(UNIQUE_PARK_QUERY)

  let responses = {}
  for (const park of parks) {
    const parkId = park.id
    const folderUid = getFolderUid(context.env, folder)
    const locationGalleries = await context.db.query(locationGalleryQuery(parkId, 'gallery', galleryType))

    const [newLocationImages, existingLocationImages] = locationGalleries.reduce((acc, image) => {
      acc[context.cache[migrationConfig.name][image.id] ? 1 : 0].push(image)
      return acc
    }, [[], []])

    if (newLocationImages.length) {
      const imageUploadResponse = await uploadAssets(context, newLocationImages, `${folder}/images`, folderUid, [...tags, park.name.replace('&', 'and')], (asset, response) => ({
        uid: response.asset.uid,
        filename: asset.path,
        parkId,
        type: galleryType,
      }))
      responses = {...responses, ...imageUploadResponse}
    }
    if (existingLocationImages.length) {
      if (migrationConfig.shouldUpdate) {
        console.log('\n\nCurrently migration does not handle updating assets. Need to DELETE/CREATE')
        /*
        * Legacy images will always be under a new id. So no need for updating content of image.
        * Also uploading a new asset creates a new contentstack uid - which entries have reference to.
        * Larger task than warrants the effort. Currently adding new images seems sufficient.
        */
      }
      responses = {...responses, ...context.cache[migrationConfig.name]}
    }
    // keep cache up to date.. It will write current cache to file in event of failure
    context.cache[migrationConfig.name] = responses
  }
  return responses
}

export const accommodationGalleryQuery = (accommodationId) => `
  SELECT m.id, m.path, m.description, ml.media_lookup_order FROM ph_db.media as m
  INNER JOIN ph_db.media_lookups as ml
  WHERE m.id = ml.media_id
  AND ml.media_lookup_type LIKE 'App_Models_HireType'
  AND ml.media_lookup_id=${accommodationId}
  ORDER BY ml.media_lookup_order ASC
`

export const uploadAccommodationGalleries = async (context, migrationConfig) => {
  const folder = 'Accommodation_Media';
  const parks = await context.db.query(UNIQUE_PARK_QUERY);

  const folderUid = getFolderUid(context.env, folder);

  const accommodationGradeNames = { '0': 'Touring Pitches' }
  const accommodationGrades = await context.db.query(accommodationGradeQuery())
  for (const grade of accommodationGrades) {
    accommodationGradeNames[grade.id] = grade.name
  }

  let responses = {}
  for (const park of parks) {
    const parkId = park.id
    const hireTypesWithImages = await context.db.query(`
      SELECT DISTINCT ht.id, ht.grading_id, ht.code, ht.accommodation_type_id, ht.accommodation_type
      FROM ph_db.hire_types as ht
      INNER JOIN ph_db.media_lookups as ml
      WHERE ht.park_id=${parkId}
      AND ml.media_lookup_type LIKE 'App_Models_HireType'
      AND ml.media_lookup_id = ht.id
      AND ht.deleted_at IS NULL
      ORDER BY grading_id ASC;
    `)

    const hireTypesByGradeId = hireTypesWithImages.reduce((acc, hireType) => {
      if (!acc[hireType.grading_id]) acc[hireType.grading_id] = []
      acc[hireType.grading_id].push(hireType)
      return acc
    }, {})

    const gradeKeys = Object.keys(hireTypesByGradeId)
    for (const gradeKey of gradeKeys) {
      if (gradeKey === 'null') continue;
      const gradeName = accommodationGradeNames[gradeKey]
      // const { imageFolderUid, videoFolderUid, parentFolderName } = accommodationGradeNames[gradeKey]
      for (const hireType of hireTypesByGradeId[gradeKey]) {
        let accommodationGalleries = await context.db.query(accommodationGalleryQuery(hireType.id))
        accommodationGalleries = accommodationGalleries.filter((ag) => {
				  return !responses[ag.id]
        })
        if (accommodationGalleries.length) {

          const [newAccommodationGalleries, existingAccommodationGalleries] = accommodationGalleries.reduce((acc, image) => {
            acc[context.cache[migrationConfig.name][image.id] ? 1 : 0].push(image)
            return acc
          }, [[], []])

          if (newAccommodationGalleries.length) {
            const tags = [
              gradeName,
              hireType.accommodation_type,
              hireType.code,
              park.name.replace('&', 'and'),
            ]
            const imageUploadResponse = await uploadAssets(context, newAccommodationGalleries, `${folder}/${gradeName}/images`, folderUid, tags, (asset, response) => ({
              uid: response.asset.uid,
              filename: asset.path,
              grade: gradeKey,
              accommodationType: hireType.accommodation_type_id,
              accommodationId: hireType.id,
              parkId,
            }))
            responses = {...responses, ...imageUploadResponse}
          }
          if (existingAccommodationGalleries.length) {
            if (migrationConfig.shouldUpdate) {
              console.log('\n\nCurrently migration does not handle updating assets. Need to DELETE/CREATE')
              /*
              * Legacy images will always be under a new id. So no need for updating content of image.
              * Also uploading a new asset creates a new contentstack uid - which entries have reference to.
              * Larger task than warrants the effort. Currently adding new images seems sufficient.
              */
            }
            responses = {...responses, ...context.cache[migrationConfig.name]}
          }
        }
        // keep cache up to date.. It will write current cache to file in event of failure
        context.cache[migrationConfig.name] = responses
      }
    }
  }
  return responses
}

