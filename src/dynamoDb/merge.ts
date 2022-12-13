/*
This is used to merge our dynamoDB config together.

e.g. if you `npm run dynamo` and read out cms_location to dynamoMirgration/parkholidays/location_read.json

you would then be able to merge it with dataCache/legacy/location.json using this script.

therefore creating a dynamoMirgration/parkholidays/location_merged.json

which you can then upload using `npm run dynamo` with ns_location as the destination

*/

import { CacheType, readSync, writeSync } from "../dataHandler/fileCache";
import { EnvironmentType } from '../types';

const NO_COLOUR = '\x1b[0m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'

const colorLog = (color, ...restArgs) => {
  console.info(color, ...restArgs, NO_COLOUR)
}

const getUserInput = (text, defaultInput = '') => new Promise<string>((resolve, reject) => {
  process.stdout.write(`${GREEN}${text} ${NO_COLOUR}`)
  process.stdin.on("data", function(data) {
    resolve(data.toString().trim() || defaultInput)
  })
})

const runImport = async () => {
  const sourceFileName = await getUserInput('Provide the source file name: (e.g. location_read)? ');
  const sourceEnv = await getUserInput('Provide the source file merge environment: (default: parkholidays)? ', 'parkholidays') as EnvironmentType;
  const sourceType = await getUserInput('Provide the source file cacheFolder: (default: dynamoMigration)? ', 'dynamoMigration') as CacheType;
  const mergeFileName = await getUserInput('Provide the merge file name: (e.g. location)? ');
  const mergeEnv = await getUserInput('Provide the source file merge environment: (default: legacy)? ', 'legacy') as EnvironmentType;
  const mergeType = await getUserInput('Provide the source file cacheFolder: (default: dataCache)? ', 'dataCache') as CacheType;


	if (!sourceFileName || !mergeFileName) {
    colorLog(RED, 'Please provide valid file names you wish to merge!');
    return process.exit(1)
  }

  const sourceObj = await readSync(sourceEnv, sourceType, sourceFileName)
  const mergeObj = await readSync(mergeEnv, mergeType, mergeFileName)

  const mergedData = Object.keys(sourceObj).reduce((acc, id) => {
    const update = {
      ...sourceObj[id],
    };
    const legacyUid = update['uid'];
    delete update['uid'];
    delete update['updated_at'];
    return  {
      ...acc,
      [id]: {
        ...update,
        ...mergeObj[legacyUid],
      }
    }
  }, {})

  writeSync(sourceEnv, sourceType, `${mergeFileName}_merged`, mergedData);

  process.exit()
}

runImport()





