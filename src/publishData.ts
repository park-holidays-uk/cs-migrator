import 'cross-fetch/polyfill'
import dotenv from 'dotenv'
import { getAssets, getEntries, removeEntries, removeAssetsWithSubFolders } from './tools'

dotenv.config()

const { api_key, base_url, management_token, email } = process.env

const publishContent = async (context) => {
  const contentUids = [
    'holiday_products',
    // 'location_categories',
    // 'location_amenities',
    // 'regions',
    // 'locations',
    // 'accommodation_types',
    // 'accommodation_grades',
    // 'accommodation_amenities',
    // 'accommodation',
  ]
  for (const contentUid of contentUids) {
    let remainingRecordCount = 1 // ensure it attempts it first time ( != 0 )
    let recordsRemoved = 0
    while (remainingRecordCount > 0) { // ContentStack is paginated to max 100 records
      const response = await getEntries(context, contentUid)
      remainingRecordCount = response.count
      const removedEntries = await removeEntries(context, contentUid, response.entries, recordsRemoved)
      recordsRemoved += removedEntries.length
    }
    console.log(`removedEntries -> [ ${contentUid} ]`, recordsRemoved)
  }
}

const publishAssets = async (context) => {
  const assetTypes = [
    'locationLogos',
    // 'locationGalleries',
    // 'accommodationGalleries',
  ]
  for (const assetType of assetTypes) {
    let recordsPublished = 0
    const assets = context.cache[assetType]
    for (const asset of assets) {
      await publishAsset(asset)

    }
    console.log(`publishedAssets -> [ ${assetType} ]`, recordsRemoved)
  }
}

const publishData = async (context) => {
	console.log("TCL: publishData -> context", context)
  process.exit()
}

export default publishData