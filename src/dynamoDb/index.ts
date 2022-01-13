import AWS from 'aws-sdk';
import { readSync, writeSync } from "../dataHandler/fileCache";

AWS.config.update({region: 'eu-west-2'});
const docClient = new AWS.DynamoDB.DocumentClient();

const NO_COLOUR = '\x1b[0m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const PURPLE = '\x1b[35m'
const YELLOW = '\x1b[33m'

const colorLog = (color, ...restArgs) => {
  console.info(color, ...restArgs, NO_COLOUR)
}

const getUserInput = (text, defaultInput = '') => new Promise<string>((resolve, reject) => {
  process.stdout.write(`${GREEN}${text} ${NO_COLOUR}`)
  process.stdin.on("data", function(data) {
    resolve(data.toString().trim() || defaultInput)
  })
})


const putItem = (params) => new Promise<number>((resolve) => {
  docClient.put(params, (err, data) => {
    if (err) {
      colorLog(RED, 'Can`t add item!', params);
      resolve(0);
    } else {
      resolve(1);
    }
  });
})

const writeToDynamoDb = async (tableName, env, type, fileName) => {
  const data = await readSync(env, type, fileName)
  let itemsAdded = 0
  for (const id in data) {
    itemsAdded += await putItem({
      TableName: tableName,
      Item: {
        id,
        ...data[id],
      }
    })
  }
  colorLog(YELLOW, `Total Items added to ${tableName}:`, itemsAdded)
}

export const arrayToKeyedObject = (arr, getKey = (item) => item.id) => arr.reduce((obj, item) => {
  obj[getKey(item)] = item
  return obj
}, {});


const getAllItems = async (params) => new Promise((resolve, reject) => {
  docClient.scan(params, (err, data) => {
    if (err) {
      colorLog(RED, 'Can`t read items!', params);
      return reject();
    }
    return resolve(arrayToKeyedObject(data?.Items || []));
  });
});

const readFromDynamoDb = async (tableName, env, type, filename, forceUpdate = false) => {
  let obj = await getAllItems({
    TableName: tableName,
  });
  if (forceUpdate) {
    obj = Object.keys(obj).reduce((acc, key) => ({
      ...acc,
      [key]: {
        ...obj[key],
        updated_at: '1960-01-01T00:00:00.000Z'
      }
    }), {})
  }
  await writeSync(env, type, filename, obj);
  colorLog(YELLOW, `Total Items added to file ${filename}:`, Object.keys(obj).length);
};

const runImport = async () => {
  const tableName = await getUserInput('Provide the table name: (e.g. cms_location)? ');
  const fileName = await getUserInput('Provide the file name: (e.g. location)? ');
  const env = await getUserInput('Provide the environment: (default: parkholidays)? ', 'parkholidays');
  const type = await getUserInput('Provide the cacheFolder: (default: stockCache)? ', 'stockCache');
  const readWrite = await getUserInput('Read or write (r/W)? ', 'w');
  let forceUpdate = false;
  if (readWrite === 'r') {
    forceUpdate = await getUserInput('Force updated_at = 1960/01/01? (y/N) ', 'n') === 'y';
  }
	if (!fileName || !tableName) {
    colorLog(RED, 'Please provide a valid table name & file name you wish to import!');
    return process.exit(1)
  }
  if (readWrite === 'r') {
    const file = fileName.endsWith('_read') ? fileName : `${fileName}_read`
    await readFromDynamoDb(tableName, env, type, file, forceUpdate);
  } else if (readWrite === 'w') {
    await writeToDynamoDb(tableName, env, type, fileName);
  }
  process.exit()
}

runImport()


