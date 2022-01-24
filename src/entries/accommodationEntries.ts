import { UNIQUE_PARK_QUERY } from '../assets/galleries'
import { arrayToUidKeyedObject, createEntries, snakeCase } from '../tools'

export const createAccommodationTypes = async (context, migrationConfig) => {
  const accommodationTypes = await context.db.query(`
    SELECT * FROM accommodation_types
    WHERE deleted_at IS NULL;
  `)
  const accommodationTypesEntries = await createEntries(
    migrationConfig,
    context,
    'accommodation_type',
    accommodationTypes,
    (accomType) => ({
      entry: {
        title: accomType.name
      }
    }),
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.accommodation_types',
    })
  )
  return accommodationTypesEntries
}

export const accommodationGradeQuery = () => `
  SELECT DISTINCT g.id, g.name, g.overview FROM ph_db.grading as g
  JOIN ph_db.hire_types as ht
  WHERE g.id = ht.grading_id;
`

const createAccommodationGradeImages = (context, accommodationTypes) => {
  return Object.keys(accommodationTypes).map((accomTypeId) => {
    return {
      accommodation_type: findReferenceInCache(context, 'accommodationType', accomTypeId),
      contextual_images: accommodationTypes[accomTypeId].map((asset) => ({
        image: asset.uid
      }))
    }
  })
}

export const createAccommodationGrades = async (context, migrationConfig) => {
  const accommodationGalleriesByGrade = Object.values(context.cache.accommodationGallery).reduce((acc, value: any) => {
    if (!acc[value.grade]) acc[value.grade] = {}
    if (!acc[value.grade][value.accommodationType]) acc[value.grade][value.accommodationType] = []
    acc[value.grade][value.accommodationType].push(value)
    return acc
  }, {})

  const accommodationGrades = await context.db.query(accommodationGradeQuery())
  accommodationGrades.unshift({
    id: 0,
    name: 'Other',
    overview: 'Used for accommodation without a valid accommodation_grade, i.e. Grass Pitch'
  })
  const accommodationGradeEntries = await createEntries(
    migrationConfig,
    context,
    'accommodation_grade',
    accommodationGrades,
    (grade) => ({
      entry: {
        title: grade.name,
        description: grade.overview,
        media: createAccommodationGradeImages(context, accommodationGalleriesByGrade[grade.id])
      }
    }),
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.grading',
    })
  )
  return accommodationGradeEntries
}

export const createAccommodationAmenities = async (context, migrationConfig) => {
  const hireTypeFeatures = await context.db.query(`
    SELECT DISTINCT htf.description, htf.sector_id, htf.id, htf.sort_order FROM ph_db.hire_type_features as htf
    INNER JOIN ph_db.hire_type_description_hire_type_feature as htdhtf
    INNER JOIN ph_db.hire_type_descriptions as htd
    INNER JOIN ph_db.hire_types as ht
    WHERE htf.id = htdhtf.hire_type_feature_id
    AND htdhtf.hire_type_description_id = htd.id
    AND ht.hire_type_description_id = htd.id
    AND ht.deleted_at IS NULL
    AND htf.deleted_at IS NULL
    AND (
      htf.sector_id = 0
      OR htf.sector_id = 1
      OR htf.sector_id = 2
    )
    ORDER BY htf.sort_order ASC;
  `)

  const accommodationAmenityEntries = await createEntries(
    migrationConfig,
    context,
    'accommodation_amenity',
    hireTypeFeatures,
    (htFeature) => ({
      entry: {
        title: htFeature.description,
      }
    }),
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.hire_type_features',
    })
  )
  return accommodationAmenityEntries
}

const findReferenceInCache = (context, cacheRef, id, contentUid = snakeCase(cacheRef)) => {
  const data = context.cache[cacheRef][id]
  if (data) {
    return [{
      'uid': data.uid,
      '_content_type_uid': contentUid
    }]
  }
}

const dbCacheHireTypeDescription = {}

const createAmenitiesOnAccomodation = async (context, hireTypeDescriptionId) => {
  if (!dbCacheHireTypeDescription[hireTypeDescriptionId]) {
    const hireTypeFeatures = await context.db.query(`
      SELECT * FROM ph_db.hire_type_features
      WHERE id in
      (
        SELECT hire_type_feature_id as id FROM ph_db.hire_type_description_hire_type_feature
        WHERE hire_type_description_id=${hireTypeDescriptionId}
      )
      AND deleted_at IS NULL
      ORDER BY sort_order;
    `)
    const accommodationAmenities = hireTypeFeatures.map((feature) => {
      const cachedAmenity = context.cache.accommodationAmenity[feature.id]
      if (cachedAmenity) {
        return ({
          'uid': cachedAmenity.uid,
          '_content_type_uid': 'accommodation_amenity'
        })
      }
    })
    dbCacheHireTypeDescription[hireTypeDescriptionId] = accommodationAmenities.filter(Boolean)
  }
  return dbCacheHireTypeDescription[hireTypeDescriptionId]
}

const createImagesOnAccomodation = async (context, hireTypeCode) => {
  const mediaLookups = await context.db.query(`
    SELECT ht.code, ml.media_id FROM ph_db.hire_types as ht
    INNER JOIN ph_db.media_lookups as ml
    WHERE ht.code="${hireTypeCode}"
    AND ml.media_lookup_type LIKE 'App_Models_HireType'
    AND ml.media_lookup_id = ht.id
    ORDER BY ml.media_lookup_order ASC;
  `)
  return mediaLookups.reduce((acc, lookup) => {
    const imageRef = findReferenceInCache(context, 'accommodationGallery', lookup.media_id)
    if (imageRef?.[0]?.uid) {
      return [
        ...acc,
        { image: findReferenceInCache(context, 'accommodationGallery', lookup.media_id)[0].uid}
      ]
    }
    return acc
  }, []);
}

export const createAccommodation = async (context, migrationConfig) => {
  let accommodationEntries = {}
  const parks = await context.db.query(UNIQUE_PARK_QUERY)
  for (const park of parks) {
    const parkId = park.id
    const hireTypes = await context.db.query(`
      SELECT * FROM ph_db.hire_types
      WHERE park_id=${parkId}
      AND deleted_at IS NULL;
    `)
    const accommodationEntriesPerPark = await createEntries(
      migrationConfig,
      context,
      'accommodation',
      hireTypes,
      async (ht) => {
        const amenitiesForThisAccomodation = await createAmenitiesOnAccomodation(context, ht['hire_type_description_id'])
        const imagesForThisAccomodation = await createImagesOnAccomodation(context, ht.code)
        return ({
          entry: {
            'title': ht.code,
            'name': ht.name,
            'holiday_product': findReferenceInCache(context, 'holidayProduct', ht['rental_type'] == 0 ? 2 : ht['rental_type']),
            'location': findReferenceInCache(context, 'location', parkId),
            'accommodation_type': findReferenceInCache(context, 'accommodationType', ht['accommodation_type_id']),
            'accommodation_grade': findReferenceInCache(context, 'accommodationGrade', ht['grading_id'] || 0),
            'accommodation_amenities': amenitiesForThisAccomodation,
            'bedrooms': ht.bedrooms,
            'sleeps': ht.berths,
            'pets_allowed': !!ht.pets_allowed,
            'accessible': !!ht.accessible,
            'contextual_images': imagesForThisAccomodation
          }
        });
      },
      ({ entry }) => ({
        uid: entry.uid,
        title: entry.title,
        from: 'db.hire_types',
      })
    )
    accommodationEntries = {...accommodationEntries, ...accommodationEntriesPerPark}
    const totalStr = `\rTotal: ${Object.keys(accommodationEntries).length}  ->  [ ${context.cache.location[parkId].title} ]: ${Object.keys(accommodationEntriesPerPark).length}`
    console.log(totalStr.padEnd(50, ' '))
  }
  return accommodationEntries
}
