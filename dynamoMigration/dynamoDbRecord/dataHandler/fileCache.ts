import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { EnvironmentType, MigrationType } from '../types'

export type CacheType = 'dataCache' | 'contentCache' | 'migrationCache' | 'dynamoMigration'


type FileContents = { [key: string]: object };

export const readSync = (env: EnvironmentType, type: CacheType, filename: string ): FileContents  => {
  let result;
  const filePath = path.resolve(__dirname, `../${type}/${env}/`, `${filename}.json`)
  try {
    result = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (error) {
    /* Silently fail - file probably does not exist */
    try {
      writeSync(env, type, filename, {})
      result = readSync(env, type, filename)
    } catch (error) {
      console.error(`Error creating required file: ${path} `, error)
    }
  }
  return result
}

export const writeSync = (env: EnvironmentType, type: CacheType, filename: string, obj) => {
  const filePath = path.resolve(__dirname, `../${type}/${env}/`, `${filename}.json`)
  try {
    writeFileSync(filePath, JSON.stringify(obj, null, 2))
  } catch (error) {
		console.error("writeSync -> error", error)
  }
}

export const getDataCache = (migrationTypes: MigrationType[]) => {
  return migrationTypes.reduce((cache, type) => {
    cache[type] = readSync('legacy', 'dataCache', type)
    return cache
  }, {})
}