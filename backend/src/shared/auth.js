import { createHash, randomBytes } from 'node:crypto'
import { pool } from './db.js'
import { sendJson } from './http.js'

const sessionCookieName = 'support_session'
const sessionDurationSeconds = 60 * 60 * 24 * 7

const getCookies = (request) => {
  const cookieHeader = request.headers.cookie || ''

  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((cookie) => cookie.trim().split('='))
      .filter(([key, value]) => key && value)
      .map(([key, ...value]) => [key, value.join('=')]),
  )
}

export const hashSessionToken = (token) => createHash('sha256').update(token).digest('hex')

export const sessionCookie = (token, maxAge = sessionDurationSeconds) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${sessionCookieName}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export const getAuthenticatedUser = async (request) => {
  const token = getCookies(request)[sessionCookieName]

  if (!token) return null

  const result = await pool.query(
    `SELECT
       u.id,
       u.role_id,
       u.full_name,
       u.email,
       u.tenant_id,
       t.display_name AS tenant_name,
       t.logo_url AS tenant_logo_url,
       r.role_key,
       r.role_name
     FROM auth_sessions AS s
     JOIN users AS u ON u.id = s.user_id
     JOIN roles AS r ON r.id = u.role_id
     LEFT JOIN tenants AS t ON t.id = u.tenant_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND u.status = 'active'
       AND r.is_active = true
       AND (u.tenant_id IS NULL OR t.status = 'active')`,
    [hashSessionToken(token)],
  )

  if (result.rowCount === 0) return null

  await pool.query(
    'UPDATE auth_sessions SET last_seen_at = now() WHERE token_hash = $1',
    [hashSessionToken(token)],
  )

  return result.rows[0]
}

export const publicUser = (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  tenantId: user.tenant_id,
  tenantName: user.tenant_name,
  tenantLogoUrl: user.tenant_logo_url,
  role: user.role_key,
  roleName: user.role_name,
})

export const requireAuthenticated = async (request, response) => {
  const user = await getAuthenticatedUser(request)

  if (!user) {
    sendJson(response, 401, { error: 'Not authenticated' })
    return null
  }

  return user
}

export const requireSuperadmin = async (request, response) => {
  const user = await requireAuthenticated(request, response)

  if (!user) return null

  if (user.role_key !== 'superadmin') {
    sendJson(response, 403, { error: 'Forbidden' })
    return null
  }

  return user
}

export const createSessionToken = () => randomBytes(32).toString('base64url')

export const getSessionToken = (request) => getCookies(request)[sessionCookieName]
