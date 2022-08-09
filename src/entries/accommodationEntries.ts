import { createEntries, findReferenceInCache } from "../tools";


const getAccommodationEntriesLatestVersion = async (context, entryIds = []) => {
  const getLatestEntry = async (entryId) => {
    const entries = await context.db.query(`
      SELECT * FROM craft_entryversions
      WHERE entryId=${entryId}
      ORDER BY dateCreated DESC, dateUpdated DESC;
    `);
    return JSON.parse(entries?.[0].data ?? {});
  };
  const entries = [];
  for (const { id: entryId } of entryIds) {
    const entry = await getLatestEntry(entryId);
    if (entry.enabled) {
      entries.push({
        ...entry,
        entryId,
      });
    }
  }
  return entries;
};

export const getAccommodationEntries = async (context, flattened = true) => {
  const getEntryIds = (typeId) =>
    context.db.query(`
    SELECT id FROM craft_entries
    WHERE sectionId=3 AND typeId=${typeId};
  `);
  const entriesTypeId = {
    'Holiday Home': 3,
    Cottage: 26,
    Glamping: 27,
    'Holiday Lodge': 28,
    'Touring Pitch': 29,
  };
  const entryIdsByType = await Promise.all(
    Object.values(entriesTypeId).map((typeId) => getEntryIds(typeId))
  );
  const entryDataByType = {};
  const entryTypeKeys = Object.keys(entriesTypeId);
  for (let i = 0; i < entryTypeKeys.length; i += 1) {
    const latestAccommodationEntries =
      await getAccommodationEntriesLatestVersion(context, entryIdsByType[i]);
    entryDataByType[entryTypeKeys[i]] = latestAccommodationEntries;
  }

  return Object.keys(entryDataByType).reduce((acc, entryType) => {
    const entries = entryDataByType[entryType].map((entry) => ({
      ...entry,
      entryType,
    }));
    return [...acc, ...entries];
  }, []);
};

export const createAccommodation = async (context, migrationConfig) => {
  const accommodationEntries = (await getAccommodationEntries(
    context
  )).map((entry) => ({
    ...entry,
    id: entry.entryId
  }));


  let uploadedAccommodationEntries = await createEntries(
    migrationConfig,
    context,
    'accommodation',
    accommodationEntries,
    async (entry) => {
      const accomGradeCode = entry.fields['52'];
      const holidayProductId = ['Touring Pitch', 'Glamping'].includes(entry.entryType) ? 2 : 1;
      const amenitiesForThisAccomodation = Object.keys(entry.fields["39"] ?? {}).reduce((acc, amenityId) => {
        const amenityRef = findReferenceInCache(context, 'accommodationAmenity', amenityId);
        if (amenityRef?.[0].uid) {
          return [
            ...acc,
            amenityRef[0]
          ];
        }
        return acc;
      }, []);
      let imageIds = entry.fields['41'] ?? [];
      const primaryImg = entry.fields['46']?.[0] ?? entry.fields['50']?.[0];
      if (primaryImg) {
        imageIds = imageIds.sort((a, b) => a === primaryImg ? -1 : 1);
      }
      const imagesForThisAccomodation = imageIds.reduce((acc, imgId) => {
        const imageRef = findReferenceInCache(context, 'accommodationGallery', imgId);
        if (imageRef?.[0].uid) {
          return [
            ...acc,
            { image: imageRef[0].uid }
          ];
        }
        return acc;
      }, []);
      return ({
        entry: {
          'title': accomGradeCode,
          'name': entry.title.slice(0, entry.title.indexOf(' at ')),
          'holiday_product': findReferenceInCache(context, 'holidayProduct', holidayProductId),
          'location': findReferenceInCache(context, 'location', entry.fields['57']?.[0]),
          'accommodation_type': findReferenceInCache(context, 'accommodationType', entry.entryType),
          'accommodation_grade': findReferenceInCache(context, 'accommodationGrade', entry.fields['56']?.[0]),
          'accommodation_amenities': amenitiesForThisAccomodation,
          'bedrooms': Number(entry.fields['35']),
          'sleeps': Number(entry.fields['42']),
          'pets_allowed': Boolean(entry.fields['44']),
          'accessible': Boolean(entry.fields['43']),
          'contextual_images': imagesForThisAccomodation
        }
      });
    },
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'pl.craft_entryversions',
    })
  )
  return uploadedAccommodationEntries
};
