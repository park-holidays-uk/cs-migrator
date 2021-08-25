import mysql from 'promise-mysql'

export const getDbConnection = async () => {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root_password',
      database: 'ph_db'
    })
    return db
  } catch (error) {
    console.error("TCL: getDbConnection ~ error", error)
  }
}
