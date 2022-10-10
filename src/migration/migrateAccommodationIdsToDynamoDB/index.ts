import 'cross-fetch/polyfill'
import {
  getEnvironmentVariables,
  migrationConfiguration
} from '../../config/envConfig'
import { getDataCache, writeSync } from '../../dataHandler/fileCache'
import { getDbConnection } from '../../db'
import { getAllEntries, snakeCase } from '../../tools'
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

  const hireTypeRows = await context.db.query(`
    SELECT code, id
    FROM hire_types
    WHERE deleted_at IS NULL;
  `);

  // save a copy of current v1 entries
  let accommEntriesCS = await getAllEntries(context, 'accommodation')
  accommEntriesCS = accommEntriesCS.map((entry) => {
    const dbID = hireTypeRows.find((row) => row.code === entry.title)?.id;
		console.log('TCL: migrateData -> dbID', dbID)
    console.log('TCL: migrateData -> entry.tags.includes(pl-scraped)', entry.tags.includes('pl-scraped'), entry.tags)
    if (dbID && entry.tags.includes('pl-scraped')) {
      return {
        id: dbID.toString(),
        from: 'pl.craft',
        title: entry.title,
        uid: entry.uid,
        updated_at: '2050-01-01T00:00:00.000Z'
      }
    }
    return null;
  }).filter(Boolean);
  writeSync(env, 'stockCache', 'accommodation_PL', accommEntriesCS)

	console.log('TCL: migrateData -> accommEntriesCS', JSON.stringify(accommEntriesCS))
  process.exit()
}

migrateData()