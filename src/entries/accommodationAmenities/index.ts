import { createEntries } from "../../tools";
import { getAccommodationEntries } from "../accommodationEntries";
import { contentstackMapping } from "./contentstackMapping";
import { createCacheResultsForAllIds, dedupeAmenities } from "./dedupeAmenities";

export type DistinctAmenitiesType = {
  [featureStrLc: string]: {
    feature: string
    ids: Set<string>
  }
}

export const createAccommodationAmenities = async (
  context,
  migrationConfig
) => {
  const accommodationEntries = (await getAccommodationEntries(
    context
  ));

  let allDistinctFeatures = accommodationEntries.reduce<DistinctAmenitiesType>((acc, entry) => {
    const features = entry.fields["39"] ?? null;
    if (features) {
      Object.keys(features).forEach((id) => {
        const featureStr = features?.[id]?.fields?.feature;
        const featureStrLc = featureStr.toLowerCase().trim();
        if (!acc[featureStrLc]) {
          if (!featureStrLc) return acc;
          const ids = new Set<string>();
          ids.add(id);
          acc[featureStrLc] = {
            feature: featureStr,
            ids,
          };
        } else {
          acc[featureStrLc].ids.add(id);
        }
      });
    }
    return acc;
  }, {});

  allDistinctFeatures = dedupeAmenities(allDistinctFeatures);

  const amenitiesToCreate = Object.keys(allDistinctFeatures).reduce((acc, featureKey) => {
    if (contentstackMapping[featureKey]) return acc;
    return [
      ...acc,
      {
        id: featureKey,
        title: allDistinctFeatures[featureKey].feature,
        featureStrLc: featureKey
      }
    ]
  }, []);

	console.log('Unique NEW amenitiesToCreate', amenitiesToCreate.length)

  const accommodationAmenityEntries = await createEntries(
    migrationConfig,
    context,
    'accommodation_amenity',
    amenitiesToCreate,
    (htFeature) => ({
      entry: {
        title: htFeature.title,
      }
    }),
    (response, entry) => ({
      uid: response.entry.uid,
      title: response.entry.title,
      featureStrLc: entry.featureStrLc,
      from: 'pl.craft_entryversions.fields[39]',
    })
  );

  const cacheResults = createCacheResultsForAllIds(accommodationAmenityEntries, allDistinctFeatures)
  return cacheResults;
};