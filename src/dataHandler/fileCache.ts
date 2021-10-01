import path from 'path'
import { EnvironmentType, MigrationType } from '../types'
import { readFileSync, writeFileSync } from 'fs'

type CacheType = 'dataCache' | 'contentCache'

const readSync = (env: EnvironmentType, type: CacheType, filename: string ) => {
  let result = null
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

export const writeDataSync = (env: EnvironmentType, filename: MigrationType, obj) => {
  writeSync(env, 'dataCache', filename, obj)
}

export const writeContentSync = (env: EnvironmentType, filename: string, obj) => {
  writeSync(env, 'contentCache', filename, obj)
}

export const getContentCache = (env: EnvironmentType, filename: string) => {
  return readSync(env, 'contentCache', filename)
}

export const getDataCache = (env: EnvironmentType, migrationTypes: MigrationType[]) => {
  return migrationTypes.reduce((cache, type) => {
    cache[type] = readSync(env, 'dataCache', type)
    return cache
  }, {})
}