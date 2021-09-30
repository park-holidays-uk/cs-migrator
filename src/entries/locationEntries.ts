import { createEntries } from '../tools'
import { parkLogoQuery, locationGalleryQuery, UNIQUE_PARK_QUERY } from '../assets/galleries'
import { defaultRegions, getRegionIdFromCounty } from '../entries/regions'

export const createHolidayProducts = async (context, migrationConfig) => {
  const sectors = await context.db.query(`
    SELECT * FROM sectors
    WHERE class != "ownership";
  `)
  const holidayProductEntries = await createEntries(
    migrationConfig,
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

export const createLocationCategories = async (context, migrationConfig) => {
  const parkTypes = await context.db.query(`
    SELECT * FROM park_types;
  `)
  const locationCategoryEntries = await createEntries(
    migrationConfig,
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


export const createRegions = async (context, migrationConfig) => {
  const regionEntries = await createEntries(
    migrationConfig,
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

const createHolidayProductDetailImages = async (sectorId, park, context) => {
  const parkImages = await context.db.query(locationGalleryQuery(park.id, 'gallery', sectorId === '1' ? 'holidays' : 'touring'))
  const allMediaBlocks = []
  const blockSize = 25
  for (let mediaBlock = 0, imageCursor = 0; imageCursor < parkImages.length; imageCursor += blockSize, mediaBlock += 1) {
    const thisMediaBlocksImages = parkImages.slice(imageCursor, (mediaBlock + 1) * blockSize)
    allMediaBlocks.push({
      holiday_product_media: {
        media: thisMediaBlocksImages.map((img, index) => ({
          file: {
            file: context.cache.locationGalleries[img.id].uid,
            order: (mediaBlock * 100) + index
          }
        })),
        type: null,
        order: mediaBlock
      }
    })
  }
  if (!parkImages.length) {
		console.error('createHolidayProductDetailImages -> ERROR-> missing information => park.id', park.id, 'sector', sectorId, 'parkImages', parkImages)
  }
  return allMediaBlocks
}

const createHolidayProductDetails = async (sectorId, park, context) => {
  const mediaBlocks = await createHolidayProductDetailImages(sectorId, park, context)
  const overviews = await createHolidayProductDetailOverviews(sectorId, park, context)
  const reasons = await createHolidayProductDetailReasons(sectorId, park, context)
  return {
    'holiday_product': {
      'holiday_product_reference': [{
          'uid': context.cache.holidayProducts[sectorId].uid,
          '_content_type_uid': 'holiday_products'
      }],
      'holiday_product_details': [
        ...mediaBlocks,
        overviews,
        reasons
      ].filter(Boolean)
    }
  }
}

const createParkLogoEntries = async (context, parkId) => {
  const parkLogos = await context.db.query(parkLogoQuery(parkId))
  return parkLogos.map((logo) => ({
    media: [{
      file: {
        file: context.cache.locationLogos[logo.id].uid
      }
    }],
    type: null,
    order: logo.media_lookup_order
  }))
}

export const createCounties = async (context, migrationConfig) => {
  const counties = await context.db.query('SELECT DISTINCT county_name, county_name as id FROM parks WHERE deleted_at IS NULL;')
  const countyEntries = await createEntries(
    migrationConfig,
    context,
    'counties',
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
  const parks = await context.db.query('SELECT * FROM parks WHERE deleted_at IS NULL;')
  const locationEntries = await createEntries(
    migrationConfig,
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
      const parkLogos = await createParkLogoEntries(context, park.id)
      const entryBody = ({
        entry: {
          'title': park.name,
          'long_name': park.name,
          'address': {
            'line_1': park['address_line_1'],
            'line_2': park['address_line_2'],
            'town': park['town'],
            'region': [{
              'uid': context.cache.regions[getRegionIdFromCounty(park['county_name'])].uid,
              '_content_type_uid': 'regions'
            }],
            'county': [{
              'uid': context.cache.counties[park['county_name']].uid,
              '_content_type_uid': 'counties'
            }],
            'postcode': park['postcode'],
            'latitude': park['gps_latitude'].toString().padEnd(8, '0'),
            'longitude': park['gps_longitude'].toString().padEnd(8, '0'),
          },
          'park_logo': parkLogos,
          'location_category': [{
            'uid': context.cache.locationCategories[park['type_id']].uid,
            '_content_type_uid': 'location_categories'
          }],
          'location_amenities': parkFacilities.map((facility) => ({
            'uid': context.cache.locationAmenities[facility.id].uid,
            '_content_type_uid': 'location_amenities'
          })),
          'product_content': locationProductContent,
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
