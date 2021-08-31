import { createEntries, snakeCase } from './tools'


export const createAccommodationTypes = async (context) => {
  const accommodationTypes = await context.db.query(`
    SELECT * FROM accommodation_types
    WHERE deleted_at IS NULL;
  `)
  const accommodationTypesEntries = await createEntries(
    context,
    'accommodation_types',
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

export const createAccommodationGrades = async (context) => {
  const accommodationGrades = await context.db.query(accommodationGradeQuery())
  const accommodationGradeEntries = await createEntries(
    context,
    'accommodation_grades',
    accommodationGrades,
    (grade) => ({
      entry: {
        title: grade.name,
        description: grade.overview
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

export const createAccommodationAmenities = async (context) => {
  const hireTypeFeatures = await context.db.query(`
    SELECT * FROM ph_db.hire_type_features
    WHERE deleted_at IS NULL
    AND (
      sector_id=1
      OR sector_id=2
    )
    ORDER BY sort_order ASC;
  `)
  const accommodationAmenityEntries = await createEntries(
    context,
    'accommodation_amenities',
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

const findReferenceInCache = (context, cacheRef, id) => {
  const data = context.cache[cacheRef][id]
  if (data) {
    return [{
      'uid': data.uid,
      '_content_type_uid': snakeCase(cacheRef).replace(/s$/, '')
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
      const cachedAmenity = context.cache.accommodationAmenities[feature.id]
      if (cachedAmenity) {
        return ({
          'uid': cachedAmenity.uid,
          '_content_type_uid': 'accommodation_amenities'
        })
      }
    })
    dbCacheHireTypeDescription[hireTypeDescriptionId] = accommodationAmenities.filter(Boolean)
  }
  return dbCacheHireTypeDescription[hireTypeDescriptionId]
}

export const createAccommodation = async (context) => {
  let accommodationEntries = {}
  const parks = await context.db.query(`
    SELECT id, name FROM parks;
  `)
  for (const park of parks) {
    const parkId = park.id
    const hireTypes = await context.db.query(`
      SELECT * FROM ph_db.hire_types
      WHERE park_id=${parkId}
      AND deleted_at IS NULL;
    `)
    const accommodationEntriesPerPark = await createEntries(
      context,
      'accommodation',
      hireTypes,
      async (ht) => {
        const amenitiesForThisAccomodation = await createAmenitiesOnAccomodation(context, ht['hire_type_description_id'])
        return ({
        entry: {
          'title': ht.code,
          'name': ht.name,
          'holiday_product': findReferenceInCache(context, 'holidayProducts', ht['rental_type'] == 0 ? 2 : ht['rental_type']),
          'location': findReferenceInCache(context, 'locations', parkId),
          'accommodation_type': findReferenceInCache(context, 'accommodationTypes', ht['accommodation_type_id']),
          'accommodation_grade': findReferenceInCache(context, 'accommodationGrades', ht['grading_id']),
          'accommodation_amenities': amenitiesForThisAccomodation,
          'bedrooms': ht.bedrooms,
          'sleeps': ht.berths,
        }
      })
      },
      ({ entry }) => ({
        uid: entry.uid,
        title: entry.title,
        from: 'db.hire_types',
      })
    )
    accommodationEntries = {...accommodationEntries, ...accommodationEntriesPerPark}
    const totalStr = `\rTotal: ${Object.keys(accommodationEntries).length}  ->  [ ${context.cache.locations[parkId].title} ]: ${Object.keys(accommodationEntriesPerPark).length}`
    console.log(totalStr.padEnd(50, ' '))
  }



  return accommodationEntries
}
