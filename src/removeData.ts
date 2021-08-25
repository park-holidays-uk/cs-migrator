import 'cross-fetch/polyfill'
import dotenv from 'dotenv'
import { getEntries, removeEntries } from './tools'
import loginForAuthToken from './login'

dotenv.config()

const { api_key, base_url, management_token, email } = process.env

const removeData = async () => {
  console.log('\n\n Build Complete!! Starting removal... \n\n\n')
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
  const contentUids = [
    // 'holiday_products',
    // 'location_categories',
    // 'location_amenities',
    // 'regions',
    'locations',
  ]
  for (const contentUid of contentUids) {
    const entriesToRemove = await getEntries(context, contentUid)
    const removedEntries = await removeEntries(context, contentUid, entriesToRemove)
    console.log(`removedEntries -> [ ${contentUid} ]`, removedEntries.length)
  }
  process.exit()
}

export default removeData