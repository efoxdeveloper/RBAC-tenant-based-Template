import { pool } from './db.js'
import { sendJson } from './http.js'

export const handleHealth = async (response) => {
  try {
    await pool.query('SELECT 1')
    sendJson(response, 200, { status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Database health check failed:', error.message)
    sendJson(response, 503, { status: 'error', database: 'disconnected' })
  }
}
