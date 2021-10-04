const { readFileSync, writeFileSync } = require('fs')
const path = require('path')

/*
*  USAGE:
*
*  node ./scrips/pluralizeContentTypes <environment> <filename>
*
*  e.g. node ./scrips/pluralizeContentTypes playground backup_version_1
*/

const folder = 'playground'// process.argv[2]
const filename = 'backup_version_1' //process.argv[3]
console.log("TCL: filename", filename)

if (!folder || !filename) {
  console.error(' Please see usage!! Missing parameters... ')
}

try {
  const filePath = path.resolve(__dirname, `../contentCache/${folder}`, `${filename}.json`)
  const {contentTypes, globalFields } = JSON.parse(readFileSync(filePath, 'utf-8'))

	console.log("TCL: result", contentTypes)

} catch (err) {
  console.log("TCL: err", err)
}