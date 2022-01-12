import AWS from 'aws-sdk';
import { readSync } from "../dataHandler/fileCache";

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

const getUserInput = (text, defaultInput = '') => new Promise((resolve, reject) => {
  process.stdout.write(`${GREEN}${text} ${NO_COLOUR}`)
  process.stdin.on("data", function(data) {
    resolve(data.toString().trim() || defaultInput)
  })
})


const putItem = (params) => new Promise<number>((resolve) => {
  docClient.put(params, (err, data) => {
    if (err) {
			console.log("TCL: putItem -> err", err)
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
        updated_at: new Date('2050/01/01').toISOString()
      }
    })
  }
  colorLog(YELLOW, `Total Items added to ${tableName}:`, itemsAdded)
}

const runImport = async () => {
  const tableName = await getUserInput('Provide the table name: (e.g. cms_location)? ')
  const fileName = await getUserInput('Provide the file name: (e.g. location)? ')
  const env = await getUserInput('Provide the environment: (default: parkholidays)? ', 'parkholidays')
  const type = await getUserInput('Provide the cacheFolder: (default: dataCache)? ', 'dataCache')
	if (!fileName || !tableName) {
    colorLog(RED, 'Please provide a valid table name & file name you wish to import!');
    return process.exit(1)
  }
  await writeToDynamoDb(tableName, env, type, fileName)
  process.exit()
}

runImport()


