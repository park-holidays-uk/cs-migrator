import importData from './importData'
import removeData from './removeData'

const reportUsage = (reason) => {
  console.log('\n\n')
  console.log(reason)
  console.log('\n')
  console.log('Usage: ')
  console.log('       npm start <command>')
  console.log('\n')
  console.log('  -command:      migrate - creates new assets/entries')
  console.log('                 remove - deletes all assets/entries')
  console.log('\n')
  console.log('  e.g.    npm start migrate\n')
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

run(process.argv[2])

