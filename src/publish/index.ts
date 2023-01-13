import 'cross-fetch/polyfill'
import { getEnvironmentVariables } from '../config/envConfig'
import { apiDelay, getAllEntries, publishEntry } from '../tools'
import { createApiCredentials, ENVIRONMENTS } from '../tools/login'
import { MigrationConfigurationType } from '../types'

const reportUsage = (reason) => {
  console.log('\n\n')
  console.log(reason)
  console.log('\n')
  console.log('Usage: ')
  console.log('       npm run publish <stack> <environment> <contentUid>')
  console.log('\n')
  console.log('  -stack:  e.g. parkleisure')
  console.log('\n')
  console.log('  -environment:  e.g. staging')
  console.log('\n')
  console.log('  -contentUid:   e.g. location ')
  // console.log('               migrate - creates new assets/entries')

  console.log('\n')
  console.log('  e.g.    npm run publish playground location\n')
  console.log('       ')
}

const availableContentUids = [
  'accommodation',
  'accommodation_grade',
  'location',
  'stock_unit',
]

const run = async (stackName, env, contentUid) => {
  if (!availableContentUids.includes(contentUid)) {
    return reportUsage('Invalid contentUid provided!')
  }
  console.log(`\n\nStarting to publish all "${contentUid}" including all references\n`)

  const context = await createApiCredentials({
    // CS_BASE_URL: 'https://eu-api.contentstack.com/v3',
    CS_BASE_URL: 'https://4y0ax61fd7.execute-api.eu-west-2.amazonaws.com/default',
  });

  const entries = await getAllEntries(context, stackName, contentUid);

  const migrationConfig = {
    stackName,
    publishEnvironments: [ env ]
  } as MigrationConfigurationType;

  let recordCount = 0
  for (const entry of entries) {
    await apiDelay(200)
    await publishEntry(context, migrationConfig, contentUid, entry);
    recordCount += 1
    process.stdout.write(`Publishing entry: [ ${entry.title || entry.uid} ] ${recordCount} ${' '.repeat(25)} \r`)
  }
  console.log(`\nAdded all ${entries.length} ${contentUid} entries to the publish queue.\n`)
}

const possibleStacks = ['global', 'parkleisure', 'parkholidays'];
if (!possibleStacks.includes(process.argv[2])) {
  reportUsage(`Invalid stack provided! (requires: ${JSON.stringify(possibleStacks)})`)
  process.exit(1)
}

if (!ENVIRONMENTS.includes(process.argv[3])) {
  reportUsage(`Invalid environment provided! (requires: ${JSON.stringify(ENVIRONMENTS)})`)
  process.exit(1)
}

if (!availableContentUids.includes(process.argv[4])) {
  reportUsage(`Invalid contentUid provided! (requires: ${JSON.stringify(availableContentUids)})`)
  process.exit(1)
}


run(process.argv[2], process.argv[3], process.argv[4])