export const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

export const readJsonBody = async (request) => {
  let body = ''

  for await (const chunk of request) {
    body += chunk

    if (body.length > 5_000_000) {
      throw new Error('Request body is too large')
    }
  }

  return JSON.parse(body || '{}')
}
