import 'cross-fetch/polyfill'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
import { getDbConnection } from '../../db'
import { getAccommodationEntries } from '../../entries/accommodationEntries'
import { createEntries, findCachedEntryFromUid, findReferenceInCache, getAllEntries, PL_SCRAPED, snakeCase } from '../../tools'
import loginForAuthToken from '../../tools/login'
import { EnvironmentType } from '../../types'


const env = process.argv[2] as EnvironmentType

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const reportUpdatedEntries = (key, context) => {
  console.log(`updatedEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length, ' '.repeat(25))
}

const migrateData = async () => {
  console.log('\n\n Build Complete!! Starting migration... \n\n\n')
  const context = await loginForAuthToken({
    base_url,
    email,
    password: null,
    management_token,
    headers: {
      api_key,
      authtoken: null,
    }
  })
  context.db = await getDbConnection()
  context.env = env
  context.cache = getDataCache(env, migrationConfiguration.map((m) => m.name))

  // save a copy of current v1 entries

  let accommEntriesCS = await getAllEntries(context, 'accommodation')
  accommEntriesCS = accommEntriesCS.map((entry) => {
    const accommodation = findCachedEntryFromUid(context, 'accommodation', entry)
    if (accommodation) {
      return {
        ...entry,
        id: accommodation.id,
        tags: [PL_SCRAPED]
      }
    }
    return null;
  }).filter(Boolean);
  writeSync(env, 'migrationCache', 'accom_preAccommAmenities', accommEntriesCS);



  // let accommEntriesCS = readSync(env, 'migrationCache', 'accom_preAccommAmenities') // used for development

  const mockMigrationConfig = {
    name: 'accommodation',
    updateKeys: {
      entry: {
        // accommodation_amenities: true,
        // contextual_images: true,
        // holiday_product: false,
        tags: true,
        name: true,
      }
    }
  } as any

  const accommodationEntriesDb = (await getAccommodationEntries(
    context
  )).reduce((acc, entry) => {
    acc[entry.entryId] = {
      ...entry,
      id: entry.entryId
    };
    return acc;
  }, {});

  // re-populate entries using new structure
  context.cache['accommodation'] = await createEntries(
    mockMigrationConfig,
    context,
    'accommodation',
    accommEntriesCS,
    async (entryCS) => {
      const entryDb = accommodationEntriesDb[entryCS.id];
      const amenitiesForThisAccomodation = Object.keys(entryDb.fields["39"] ?? {}).reduce((acc, amenityId) => {
        const amenityRef = findReferenceInCache(context, 'accommodationAmenity', amenityId);
        if (amenityRef?.[0].uid) {
          return [
            ...acc,
            amenityRef[0]
          ];
        }
        return acc;
      }, [] as any);

      let imageIds = entryDb.fields['41'] ?? [];
      const primaryImg = entryDb.fields['46']?.[0] ?? entryDb.fields['50']?.[0];
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

      const atIndex = entryDb.title.indexOf(' at ');
      const name = atIndex > 0 ? entryDb.title.slice(0, atIndex) : entryDb.title;
      const update = {...entryCS};
      update.name = name;
      return ({
        entry: update
      })
    },
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'pl.craft_entryversions',
    })
  )
  reportUpdatedEntries('accommodation', context)
  process.exit()
}

migrateData()