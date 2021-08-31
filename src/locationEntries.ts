import { createEntries } from './tools'
import { defaultRegions, getRegionIdFromCounty } from './regions'

export const createHolidayProducts = async (context) => {
  const sectors = await context.db.query(`
    SELECT * FROM sectors
    WHERE class != "ownership";
  `)
  const holidayProductEntries = await createEntries(
    context,
    'holiday_products',
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

export const createLocationCategories = async (context) => {
  const parkTypes = await context.db.query(`
    SELECT * FROM park_types;
  `)
  const locationCategoryEntries = await createEntries(
    context,
    'location_categories',
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

export const createLocationAmenities = async (context) => {
  // park_facility_category_id
  // 1 = Facilities, 2 = Neighbouring Park Facilities, 3 = What's on, 4 = In the local area
  const parkFacilities = await context.db.query(`
    SELECT * FROM park_facilities
    WHERE park_facility_category_id=1;
  `)
  const locationAmenityEntries = await createEntries(
    context,
    'location_amenities',
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


export const createRegions = async (context) => {
  const regionEntries = await createEntries(
    context,
    'regions',
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
  `)
  if (parkSectorInfo[0]) {
    return {
      "holiday_product_overviews": {
        "holiday_product_short_overview": parkSectorInfo[0]['short_overview'],
        "holiday_product_long_overview": parkSectorInfo[0]['full_overview'],
      }
    }
  } else {
		console.error('createHolidayProductDetailOverviews -> ERROR-> missing information => park.id', park.id, 'sector', sectorId, 'parkSectorInfo', parkSectorInfo)
  }
}

const createHolidayProductDetailReasons = async (sectorId, park, context) => {
  const parkReasonsToLove = await context.db.query(`
    SELECT * from ph_db.park_reasons_to_love
    WHERE sector_id=${sectorId}
    AND park_id=${park.id};
  `)
  if (parkReasonsToLove.length >= 3) {
    return {
      "holiday_product_reasons": {
        "holiday_product_reason": parkReasonsToLove.map((r) => r.text)
      }
    }
  } else {
		console.error('createHolidayProductDetailReasons -> ERROR-> missing information => park.id', park.id, 'sector', sectorId, 'parkReasonsToLove', parkReasonsToLove)
  }
}

const createHolidayProductDetails = async (sectorId, park, context) => {
  const overviews = await createHolidayProductDetailOverviews(sectorId, park, context)
  const reasons = await createHolidayProductDetailReasons(sectorId, park, context)
  return {
    'holiday_product': {
      'holiday_product_reference': [{
          'uid': context.cache.holidayProducts[sectorId].uid,
          '_content_type_uid': 'holiday_products'
      }],
      'holiday_product_details': [
        overviews,
        reasons
      ].filter(Boolean)
    }
  }
}

export const createLocations = async (context) => {
  const parks = await context.db.query('SELECT * FROM parks')
  const locationEntries = await createEntries(
    context,
    'locations',
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
        locationProductContent.push(await createHolidayProductDetails('1', park, context))
      }
      if (park['is_touring_park']) {
        locationProductContent.push(await createHolidayProductDetails('2', park, context))
      }
      const entryBody = ({
        entry: {
          'title': park.name,
          'long_title': park.name,
          'address': {
            'line_1': park['address_line_1'],
            'line_2': park['address_line_2'],
            'town': park['town'],
            'region': [{
              'uid': context.cache.regions[getRegionIdFromCounty(park['county_name'])].uid,
              '_content_type_uid': 'regions'
            }],
            'postcode': park['postcode'],
            'latitude': park['gps_latitude'].toString().padEnd(8, '0'),
            'longitude': park['gps_longitude'].toString().padEnd(8, '0'),
          },
          'location_category': [{
            'uid': context.cache.locationCategories[park['type_id']].uid,
            '_content_type_uid': 'location_categories'
          }],
          'location_amenities': parkFacilities.map((facility) => ({
            'uid': context.cache.locationAmenities[facility.id].uid,
            '_content_type_uid': 'location_amenities'
          })),
          "product_content": locationProductContent
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
