import path from 'path'
import { EnvironmentType, MigrationType } from '../types'
import { readFileSync, writeFileSync } from 'fs'

const readSync = (env: EnvironmentType, type: MigrationType) => {
  let result = null
  const filePath = path.resolve(__dirname, `../dataCache/${env}/`, `${type}.json`)
  try {
    result = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (error) {
    /* Silently fail - file probably does not exist */
    try {
      writeSync(env, type, {})
      result = readSync(env, type)
    } catch (error) {
      console.error(`Error creating required file: ${path} `, error)
    }
  }
  return result
}

export const writeSync = (env: EnvironmentType, type: MigrationType, obj) => {
  writeFileSync(path.resolve(__dirname, `../dataCache/${env}/`, `${type}.json`), JSON.stringify(obj, null, 2))
}

export const getCache = (env: EnvironmentType, migrationTypes: MigrationType[]) => {
  return migrationTypes.reduce((cache, type) => {
    cache[type] = readSync(env, type)
    return cache
  }, {})
}