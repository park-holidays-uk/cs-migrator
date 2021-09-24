import importData from './importData'
import removeData from './removeData'

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
      console.log('No command provided! (requires: migrate / remove)')
    }
  }
}

run(process.argv[2])

