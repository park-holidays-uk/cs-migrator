import importData from './importData'
import removeData from './removeData'

const command = process.argv[2]

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
