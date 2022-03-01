import 'cross-fetch/polyfill'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from './config/envConfig'
import { getDataCache, writeSync } from './dataHandler/fileCache'
import { getDbConnection } from './db'
import { snakeCase } from './tools'
import loginForAuthToken from './tools/login'
import { EnvironmentType } from './types'

const env = process.argv[2] as EnvironmentType

const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

const reportCreatedEntries = (key, context) => {
  console.log(`createdEntries -> [ ${snakeCase(key)} ]`, Object.keys(context.cache[key]).length, ' '.repeat(25))
}

const importData = async () => {
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

  const migrations = migrationConfiguration.filter((migration) => {
    return migration.includeInMigration
  })

  for (const migrationConfig of migrations) {
    try {
      context.cache[migrationConfig.name] = await migrationConfig.handler(context, migrationConfig)
      reportCreatedEntries(migrationConfig.name, context)
      writeSync(env, 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])
    } catch (error) {
      console.error('Error during migrations ',  error)
      console.error('Cache saved at this point: ', migrationConfig)
      console.error('Cache: ', context.cache[migrationConfig.name])
      writeSync(env, 'dataCache', migrationConfig.name, context.cache[migrationConfig.name])
    } finally {

    }
  }
  process.exit()
}

export default importData