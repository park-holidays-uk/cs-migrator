import importContentTypes from './import'
import exportContentTypes from './export'

const reportUsage = (reason) => {
  console.log('\n\n')
  console.log(reason)
  console.log('\n')
  console.log('Usage: ')
  console.log('       npm run types <environment> <command> <foldername> [options]')
  console.log('\n')
  console.log('  -environment:  playground or parkholidays')
  console.log('\n')
  console.log('  -command:      import - creates new Content Types (overwrites any clashes)')
  // console.log('               migrate - creates new assets/entries')
  console.log('                 export - copies all Content Types to foldername')
  console.log('\n')
  console.log('  -foldername:   folder to use for import/export ( /contentCache/? )')
  console.log('\n')
  console.log('  -[options]:    -r   Remove content types not defined in contentCache')
  console.log('\n')
  console.log('  e.g.    npm run types playground import pre-version-2\n')
  console.log('       ')
}

const run = async (command) => {
  switch(command) {
    case 'import': {
      importContentTypes()
      break;
    }
    case 'export': {
      exportContentTypes()
      break;
    }

    default: {
      reportUsage('No command provided! (requires: import / export)')
    }
  }
}

if (!(process.argv[2] === 'playground' || process.argv[2] === 'parkholidays')) {
  reportUsage('Invalid environment provided! (requires: parkholidays / playground)')
  process.exit(1)
}

run(process.argv[3])