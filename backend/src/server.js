import http from 'node:http'
import { pool, port } from './shared/db.js'
import { handleHealth } from './shared/health.js'
import { sendJson } from './shared/http.js'
import { handlePlatformRoutes } from './modules/platform/index.js'

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === 'GET' && request.url === '/health') {
      await handleHealth(response)
      return
    }

    const handled = await handlePlatformRoutes(request, response)
    if (handled) return

    sendJson(response, 404, { error: 'Route not found' })
  } catch (error) {
    console.error('Request failed:', error.message)
    sendJson(response, 500, { error: 'Internal server error' })
  }
})

server.listen(port, () => {
  console.log(`Support CRM backend listening on http://localhost:${port}`)
})

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down.`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
