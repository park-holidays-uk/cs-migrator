import 'cross-fetch/polyfill'
import {
  migrationConfiguration
} from './config/envConfig'
import { getDataCache, writeSync } from './dataHandler/fileCache'
import { snakeCase } from './tools'
import { createApiCredentials } from './tools/login'

const reportCreatedEntries = (key, context) => {
  console.log(`createdEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length, ' '.repeat(25))
}

const importData = async () => {
  console.log('\n\n Build Complete!! Starting migration... \n\n\n')
  const context = await createApiCredentials({
    CS_BASE_URL: 'https://eu-api.contentstack.com/v3',
    // CS_BASE_URL: 'https://4y0ax61fd7.execute-api.eu-west-2.amazonaws.com/default',
  })
  context.cache = getDataCache(migrationConfiguration.map((m) => m.name))

  const migrations = migrationConfiguration.filter((migration) => {
    return migration.includeInMigration
  })

  for (const migrationConfig of migrations) {
    try {
      context.cache[migrationConfig.name] = await migrationConfig.handler(context, migrationConfig)
      reportCreatedEntries(migrationConfig.name, context)
      writeSync('legacy', 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])
    } catch (error) {
      console.error('Error during migrations ',  error)
      console.error('Cache saved at this point: ', migrationConfig)
      console.error('Cache: ', context.cache[migrationConfig.name])
      writeSync('legacy', 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])
    } finally {

    }
  }
  process.exit()
}

export default importData