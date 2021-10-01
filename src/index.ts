import importData from './importData'
import removeData from './removeData'

const reportUsage = (reason) => {
  console.log('\n\n')
  console.log(reason)
  console.log('\n')
  console.log('Usage: ')
  console.log('       npm run <environment> <command>')
  console.log('\n')
  console.log('  -environment:  playground or parkholidays')
  console.log('\n')
  console.log('  -command:      migrate - creates new assets/entries')
  // console.log('               migrate - creates new assets/entries')
  console.log('                 remove - deletes all assets/entries')
  console.log('\n')
  console.log('  e.g.    npm run playground migrate\n')
  console.log('       ')
}

const run = async (command) => {
  switch(command) {
    case 'migrate': {
      importData()
      break;
    }
    case 'remove': {
      removeData()
      break;
    }

    default: {
      reportUsage('No command provided! (requires: migrate / remove)')
    }
  }
}

if (!(process.argv[2] === 'playground' || process.argv[2] === 'parkholidays')) {
  reportUsage('Invalid environment provided! (requires: parkholidays / playground)')
  process.exit(1)
}

run(process.argv[3])

