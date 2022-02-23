import { locationGalleryQuery, LocationGallerySectorType, parkLogoQuery } from '../assets/galleries'
import { getEnvironmentVariables } from '../config/envConfig'
import { defaultRegions, getRegionIdFromCounty } from '../entries/regions'
import { createEntries, findReferenceInCache } from '../tools'

export const createHolidayProducts = async (context, migrationConfig) => {
  const sectors = await context.db.query(`
    SELECT * FROM sectors
    WHERE class != "ownership";
  `)
  const holidayProductEntries = await createEntries(
    migrationConfig,
    context,
    'holiday_product',
    sectors,
    (sector) => ({
      entry: {
        title: sector['long_name'],
        rental_type: sector.id == 1 ? 'Holidays' : sector.id == 2 ? 'Touring' : ''
      }
    }),
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.sectors',
    })
  )
  return holidayProductEntries
}

export const createLocationCategories = async (context, migrationConfig) => {
  const parkTypes = await context.db.query(`
    SELECT * FROM park_types;
  `)
  const locationCategoryEntries = await createEntries(
    migrationConfig,
    context,
    'location_category',
    parkTypes,
    (parkType) => ({
      entry: {
        title: parkType.description
      }
    }),
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.park_types',
    })
  )
  return locationCategoryEntries
}

export const createLocationAmenities = async (context, migrationConfig) => {
  // park_facility_category_id
  // 1 = Facilities, 2 = Neighbouring Park Facilities, 3 = What's on, 4 = In the local area
  const parkFacilities = await context.db.query(`
    SELECT * FROM park_facilities
    WHERE park_facility_category_id=1;
  `)
  const locationAmenityEntries = await createEntries(
    migrationConfig,
    context,
    'location_amenity',
    parkFacilities,
    (parkFacility) => ({
      entry: {
        title: parkFacility.name
      }
    }),
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.park_facilities',
    })
  )
  return locationAmenityEntries
}


export const createRegions = async (context, migrationConfig) => {
  const regionEntries = await createEntries(
    migrationConfig,
    context,
    'region',
    defaultRegions,
    (region) => ({
      entry: {
        title: region.title
      }
    }),
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'migration.defaultRegions',
    })
  )
  return regionEntries
}

const createHolidayProductDetailOverviews = async (sectorId, park, context) => {
  const parkSectorInfo = await context.db.query(`
    SELECT * from ph_db.park_sector_info
    WHERE id IN
    (
      SELECT park_sector_info_id
        FROM ph_db.park_sector_info_lookups
        WHERE park_id=${park.id}
        AND sector_id=${sectorId}
    );
  `);
  if (parkSectorInfo[0]) {
    return {
      overview: {
        short_overview: parkSectorInfo[0]['short_overview'],
        long_overview: parkSectorInfo[0]['full_overview'],
      }
    };
  } else {
		console.error('createHolidayProductDetailOverviews -> ERROR-> missing information => park.id', park.id, 'sector', sectorId, 'parkSectorInfo', parkSectorInfo);
    return {};
  }
}

const createHolidayProductDetailReasons = async (sectorId, park, context) => {
  const { Icon_Star } = getEnvironmentVariables(context.env);
  const parkReasonsToLove = await context.db.query(`
    SELECT * from ph_db.park_reasons_to_love
    WHERE sector_id=${sectorId}
    AND park_id=${park.id};
  `)
  if (parkReasonsToLove.length >= 3) {
    return {
      highlights: parkReasonsToLove.map((r) => ({
        icon: [{
          uid: Icon_Star,
          _content_type_uid: 'icon'
        }],
        title: r.text
      }))
    }
  } else {
		console.error('createHolidayProductDetailReasons -> ERROR-> missing information => park.id', park.id, 'sector', sectorId, 'parkReasonsToLove', parkReasonsToLove)
    return {};
  }
}

const createProductImages = async (context, cacheRef, productType: LocationGallerySectorType, parkId) => {
  const parkImages = await context.db.query(locationGalleryQuery(parkId, 'gallery', productType))
  if (!parkImages.length) {
		console.error('createProductImages -> ERROR-> missing information => park.id', parkId, 'sector', productType, 'parkImages', parkImages)
    return {}
  }
  return {
    contextual_images: parkImages.map((img) => {
      const image = context.cache[cacheRef]?.[img.id]?.uid
      return image ? { image } : null;
    }).filter(Boolean)
  }
}

const createHolidayProductDetails = async (sectorId, park, context, migrationConfig) => {
  // TCL: 'ownershipLocationGallery' -> 'locationGallery'
  const contextualImages = await createProductImages(context, 'ownershipLocationGallery', sectorId === '1' ? 'holidays' : 'touring', park.id);
  const overviews = await createHolidayProductDetailOverviews(sectorId, park, context)
  const reasons = await createHolidayProductDetailReasons(sectorId, park, context)
  return {
    'holiday_product': findReferenceInCache(context, 'holidayProduct', sectorId, 'holiday_product') ,
    ...overviews,
    ...reasons,
    ...contextualImages,
  }
}

const createSalesJourneyOverviews = async (context, parkId) => {
  const parkSectorInfo = await context.db.query(`
    SELECT psi.medium_overview, psi.full_overview
    FROM park_sector_info as psi
    INNER JOIN park_sector_info_lookups as lu
    WHERE psi.id = lu.park_sector_info_id
    AND lu.park_id = ${parkId}
    AND lu.sector_id = 3
  `)
  if (parkSectorInfo[0]) {
    return {
      "short_overview": parkSectorInfo[0]['medium_overview'],
      "long_overview": parkSectorInfo[0]['full_overview'],
    }
  } else {
		console.error('createSalesJourneyOverviews -> ERROR-> missing information => park.id', parkId, 'parkSectorInfo', parkSectorInfo)
  }
};

const createSalesHighlights = async (context, parkId) => {
  const { Icon_Star } = getEnvironmentVariables(context.env);
  const parkReasonsToLove = await context.db.query(`
    SELECT * from ph_db.park_reasons_to_love
    WHERE sector_id=3
    AND park_id=${parkId};
  `)
  if (parkReasonsToLove.length >= 2) {
    return parkReasonsToLove.map((r) => ({
      icon: [{
        "uid": Icon_Star,
        "_content_type_uid": "icon"
      }],
      title: r.text,
      subtitle: ''
    }))
  } else {
		console.error('createSalesHighlights -> ERROR-> missing information => park.id', parkId, 'parkReasonsToLove', parkReasonsToLove)
  }
}

const createSalesProductContent = async (context, migrationConfig, park) => {
  // TCL: 'ownershipLocationGallery' -> 'locationGallery'
  const contextualImages = await createProductImages(context, 'ownershipLocationGallery', 'ownership', park.id);
  const overview = await createSalesJourneyOverviews(context, park.id);
  const highlights = await createSalesHighlights(context, park.id);
  return {
    overview,
    highlights,
    ...contextualImages,
  }
};

const createParkLogoEntry = async (context, parkId) => {
  const parkLogos = await context.db.query(parkLogoQuery(parkId))
  if (parkLogos.length) {
    return {
      park_logo: {
        image: context.cache.locationLogo[parkLogos[0].id]?.uid
      }
    }
  }
  return {};
}


export const createCounties = async (context, migrationConfig) => {
  const counties = await context.db.query('SELECT DISTINCT county_name, county_name as id FROM parks WHERE deleted_at IS NULL;')
  const countyEntries = await createEntries(
    migrationConfig,
    context,
    'county',
    counties,
    (county) => ({
      entry: {
        title: county['county_name']
      }
    }),
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.parks',
    })
  )
  return countyEntries
}


export const createLocations = async (context, migrationConfig) => {
  const parks = await context.db.query('SELECT * FROM parks WHERE deleted_at IS NULL LIMIT 1;')
  const locationEntries = await createEntries(
    migrationConfig,
    context,
    'location',
    parks,
    async (park) => {
      const parkFacilities = await context.db.query(`
        SELECT * FROM ph_db.park_facilities
        WHERE id IN
          (
            SELECT facility_id AS id FROM ph_db.park_facility_lookups
                WHERE facility_category_id=1
                AND park_facility_lookup_id=${park.id}
          )
        AND park_facility_category_id=1
        ORDER BY sort_order ASC;
      `)
      const locationProductContent = []
      if (park['is_holidays_park']) {
        locationProductContent.push(await createHolidayProductDetails('1', park, context, migrationConfig))
      }
      if (park['is_touring_park']) {
        locationProductContent.push(await createHolidayProductDetails('2', park, context, migrationConfig))
      }
      const salesProductContent = await createSalesProductContent(context, migrationConfig, park);
      const parkLogo = await createParkLogoEntry(context, park.id)
      const entryBody = ({
        entry: {
          'title': park.name,
          'long_name': park.name,
          'address': {
            'line_1': park['address_line_1'],
            'line_2': park['address_line_2'],
            'town': park['town'],
            'region': [{
              'uid': context.cache.region[getRegionIdFromCounty(park['county_name'])].uid,
              '_content_type_uid': 'region'
            }],
            'county': [{
              'uid': context.cache.county[park['county_name']].uid,
              '_content_type_uid': 'county'
            }],
            'postcode': park['postcode'],
            'latitude': park['gps_latitude'].toString().padEnd(8, '0'),
            'longitude': park['gps_longitude'].toString().padEnd(8, '0'),
          },
          ...parkLogo,
          'location_category': [{
            'uid': context.cache.locationCategory[park['type_id']].uid,
            '_content_type_uid': 'location_category'
          }],
          'location_amenities': parkFacilities.map((facility) => ({
            'uid': context.cache.locationAmenity[facility.id].uid,
            '_content_type_uid': 'location_amenity'
          })),
          'holiday_product_contents': locationProductContent,
          'sales_product_content': salesProductContent,
          'park_code': park['code']
        }
      })
      return entryBody
    },
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.parks',
    })
  )
  return locationEntries
}
