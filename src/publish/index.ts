import 'cross-fetch/polyfill'
import { apiDelay, publishEntry,  getAllEntries } from '../tools'
import loginForAuthToken from '../tools/login'
import { getEnvironmentVariables } from '../config/envConfig'

const reportUsage = (reason) => {
  console.log('\n\n')
  console.log(reason)
  console.log('\n')
  console.log('Usage: ')
  console.log('       npm run publish <environment> <contentUid>')
  console.log('\n')
  console.log('  -environment:  playground or parkholidays')
  console.log('\n')
  console.log('  -contentUid:   e.g. location ')
  // console.log('               migrate - creates new assets/entries')

  console.log('\n')
  console.log('  e.g.    npm run publish playground location\n')
  console.log('       ')
}

const availableContentUids = ['location']

const run = async (env, contentUid) => {
  if (!availableContentUids.includes(contentUid)) {
    return reportUsage('Invalid contentUid provided!')
  }
  console.log(`Starting to publish all "${contentUid}" including all references\n`)

  const { api_key, base_url, management_token, email } = getEnvironmentVariables(env)

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

  const entries = await getAllEntries(context, contentUid)

  for (const entry of entries) {
    await apiDelay(150)
    await publishEntry(context, contentUid, entry, null)
  }
}

if (!(process.argv[2] === 'playground' || process.argv[2] === 'parkholidays')) {
  reportUsage('Invalid environment provided! (requires: parkholidays / playground)')
  process.exit(1)
}

run(process.argv[2], process.argv[3])