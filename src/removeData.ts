import 'cross-fetch/polyfill'
import { camelCase, snakeCase } from './tools'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from './config/envConfig'
import { writeSync } from './dataHandler/fileCache'
import { getAssets, getEntries, removeEntries, removeAssetsWithSubFolders } from './tools'
import loginForAuthToken from './tools/login'
import { EnvironmentType } from './types'

const env = process.argv[2] as EnvironmentType

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const contentToRemove = migrationConfiguration.filter((migration) => {
  return migration.includeInMigration && migration.type === 'entry'
})

const removeContent = async (context) => {
  const contentUids = contentToRemove.map((item) => snakeCase(item.name))
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
    writeSync(env, camelCase(contentUid), {})
  }
}

const assetsToRemove = migrationConfiguration.filter((migration) => {
  return migration.includeInMigration && migration.type === 'asset'
})

const removeAssetsByFolder = async (context) => {
  const folders = assetsToRemove.map((item) => item.folderName)
  for (const folder of folders) {
    let remainingRecordCount = 1 // ensure it attempts it first time ( != 0 )
    let recordsRemoved = 0
    while (remainingRecordCount > 0) { // ContentStack is paginated to max 100 records
      const response = await getAssets(context, folder)
      remainingRecordCount = response.count
      const removedAssets = await removeAssetsWithSubFolders(context, folder, response.assets, recordsRemoved)
      recordsRemoved += removedAssets.length
    }
    console.log(`removedAssets -> [ ${folder} ]`, recordsRemoved)
  }
}

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
  context.env = env
  await removeAssetsByFolder(context)
  await removeContent(context)
  process.exit()
}

export default removeData


/*
"park_logo": [
  {
      "media": [
          {
              "file": {
                  "file": "bltcdb01bc9c260f6fc" // OR ["bltcdb01bc9c260f6fc", "bltcdb01bc9c260485d", "bltcdb01bc9cac456"]
              }
          }
      ],
      "type": null,
      "order": 3
  }
]


"product_content": [{
  "holiday_product": {
    "holiday_product_reference": [{
      "uid": "blt41b92151ac79946e",
      "_content_type_uid": "holiday_products"
    }],
    "holiday_product_details": [{
      "holiday_product_overviews": {
        "holiday_product_short_overview": "This is a short overview",
        "holiday_product_long_overview": "This is an even longer overview"
      }
    }, {
      "holiday_product_media":  {
        "media": [{
          "file": {
              "file": "blt6eb2954f9a55d7f8"
          }
        }],
        "type": null,
        "order": 1
      }
    }]
  }
}]

*/