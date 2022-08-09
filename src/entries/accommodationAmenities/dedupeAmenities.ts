import { DistinctAmenitiesType } from "./accommodationEntries";
import { contentstackMapping } from "./contentstackMapping";

const flattenAmenities = (termsToSmoosh, allDistinctFeatures) => {
  const [first, ...restTerms] = termsToSmoosh;
  restTerms.forEach((term) => {
    Array.from(allDistinctFeatures[term]?.ids ?? []).forEach((id) => allDistinctFeatures[first].ids.add(id));
    delete allDistinctFeatures[term];
  })
}

export const dedupeAmenities = (allDistinctFeatures) => {
  /* do some manual clean up */
  if (allDistinctFeatures['allocated parkingdouble glazing & central heating']) {
    allDistinctFeatures['double glazing & central heating'].ids.add('176');
    allDistinctFeatures['allocated parking'].ids.add('176');
    delete allDistinctFeatures['allocated parkingdouble glazing & central heating']
  }

  flattenAmenities([
    'allocated parking',
    'allocated parking space'
  ], allDistinctFeatures);

  flattenAmenities([
    'pet-friendly',
    'pet friendly accommodation',
    'pet-friendly accomodation',
  ], allDistinctFeatures)

  flattenAmenities([
    'fridge freezer',
    'fridge & freezer',
  ], allDistinctFeatures)

  flattenAmenities([
    'bluetooth speakers',
    'built-in bluetooth sound system',
    'bluetooth sound system',
    'bluetooth music centre',
  ], allDistinctFeatures)

  flattenAmenities([
    'patio area with outdoor furniture',
    'separate seating and table for decking area',
    'decking area with seating',
    'outside veranda with table & chairs',
    'outdoor table and chairs',
  ], allDistinctFeatures)

  flattenAmenities([
    'low level cooker',
    'lower level cooker',
  ], allDistinctFeatures)

  flattenAmenities([
    'dishwasher',
    'integrated dishwasher',
  ], allDistinctFeatures)


  flattenAmenities([
    'patio doors',
    'sliding patio door',
    'sliding patio doors',
  ], allDistinctFeatures)


  flattenAmenities([
    'free standing table & chairs',
    'free-standing dining table & chairs',
  ], allDistinctFeatures)

  flattenAmenities([
    'en-suite',
    'en-suite bathroom',
  ], allDistinctFeatures)

  flattenAmenities([
    'spacious open-plan living with large kitchen',
    'spacious open-plan living with modern kitchen',
  ], allDistinctFeatures)

  flattenAmenities([
    'sleeps 6 with sofa bed',
    'sleeps 6 when using sofa bed',
  ], allDistinctFeatures)

  flattenAmenities([
    'usb charge points',
    'usp point sockets',
  ], allDistinctFeatures)

  return allDistinctFeatures;
}

export const createCacheResultsForAllIds = (newAmenityEntries, allDistinctFeatures: DistinctAmenitiesType) => {
  const allCachedResults = Object.keys(allDistinctFeatures).reduce((acc, featureStrLc) => {
    const existingAmenity = !!contentstackMapping[featureStrLc];
    Array.from(allDistinctFeatures[featureStrLc].ids).forEach((parkLeisureId) => {
      acc[parkLeisureId] = {
        uid: (existingAmenity ? contentstackMapping[featureStrLc]?.uid : newAmenityEntries[featureStrLc]?.uid) ?? 'not found',
        title: allDistinctFeatures[featureStrLc]?.feature ?? 'not found',
        from: "pl.craft_entryversions.fields[39]",
        featureStrLc,
        mappedToExistingAmenity: existingAmenity,
      }
    })
    return acc;
  }, {});
  return allCachedResults;
};
