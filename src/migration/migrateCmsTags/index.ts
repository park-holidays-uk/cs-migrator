import 'cross-fetch/polyfill'
import FormData from 'form-data'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
import { apiDelay, getAllAssets, publishAsset, snakeCase } from '../../tools'
import loginForAuthToken from '../../tools/login'
import { EnvironmentType } from '../../types'


const CMS_SCRAPER_TAG = 'cms-scraped';


const env = process.argv[2] as EnvironmentType

const { api_key, base_url, management_token, email, Accommodation_Media } = getEnvironmentVariables(env)

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
  context.env = env
  context.cache = getDataCache(env, migrationConfiguration.map((m) => m.name))

  // save a copy of current v1 entries
  const accommodationImages = await getAllAssets(context, Accommodation_Media)
  writeSync(env, 'migrationCache', 'accommodationImages_preTags', accommodationImages)

  // let accommodationImages = readSync(env, 'migrationCache', 'accommodationImages_preTags') // used for development

	console.log('TCL: migrateData -> accommodationImages', accommodationImages.length)

  let recordCount = 0;
  for (const asset of accommodationImages) {
    process.stdout.write(`Tagging assets: ${recordCount += 1} ${' '.repeat(25)}\r`)
    await apiDelay()
    const headers = {
      ...context.headers,
      'authorization': context.management_token,
    }
    const tags = asset['tags'] ?? [];
    if (!tags.includes(CMS_SCRAPER_TAG)) {
      tags.unshift(CMS_SCRAPER_TAG);
    }
    try {
      const formData = new FormData();
      formData.append('asset[tags]', tags.join(','))
      const res = await fetch(`${context.base_url}/assets/${asset.uid}`, {
        method: 'PUT',
        headers,
        body: formData as any
      })
      const response = await res.json()
      if (response['error_code']) {
        console.error(`\r[ ${asset.path} ]: `, response.errors)
      } else {
        await publishAsset(context, response.asset.uid)
      }
    } catch (error) {
      console.error("uploadAssets -> error", error)
      throw new Error(error);
    }
  }
  process.exit()
}

migrateData()