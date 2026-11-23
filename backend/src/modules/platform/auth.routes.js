import argon2 from 'argon2'
import { pool } from '../../shared/db.js'
import {
  createSessionToken,
  getSessionToken,
  hashSessionToken,
  publicUser,
  requireAuthenticated,
  sessionCookie,
} from '../../shared/auth.js'
import { readJsonBody, sendJson } from '../../shared/http.js'

export const handleAuthRoutes = async (request, response) => {
  if (request.method === 'POST' && request.url === '/auth/login') {
    const { email, password } = await readJsonBody(request)

    if (typeof email !== 'string' || typeof password !== 'string') {
      sendJson(response, 400, { error: 'Email and password are required' })
      return true
    }

    const result = await pool.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.tenant_id,
         t.display_name AS tenant_name,
         t.logo_url AS tenant_logo_url,
         u.password_hash,
         r.role_key,
         r.role_name
       FROM users AS u
       JOIN roles AS r ON r.id = u.role_id
       LEFT JOIN tenants AS t ON t.id = u.tenant_id
       WHERE u.email = $1
         AND u.status = 'active'
         AND r.is_active = true
         AND (u.tenant_id IS NULL OR t.status = 'active')`,
      [email.trim()],
    )

    const user = result.rows[0]
    const passwordMatches = user ? await argon2.verify(user.password_hash, password) : false

    if (!user || !passwordMatches) {
      sendJson(response, 401, { error: 'Invalid email or password' })
      return true
    }

    const token = createSessionToken()
    await pool.query(
      `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '7 days')`,
      [user.id, hashSessionToken(token)],
    )
    await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id])

    response.setHeader('Set-Cookie', sessionCookie(token))
    sendJson(response, 200, { status: 'ok', user: publicUser(user) })
    return true
  }

  if (request.method === 'GET' && request.url === '/auth/me') {
    const user = await requireAuthenticated(request, response)
    if (!user) return true

    sendJson(response, 200, { status: 'ok', user: publicUser(user) })
    return true
  }

  if (request.method === 'GET' && request.url === '/auth/navigation') {
    const user = await requireAuthenticated(request, response)
    if (!user) return true

    const navigationResult = await pool.query(
      `SELECT
         p.id,
         p.page_key,
         p.display_name,
         p.route,
         p.icon_key,
         p.page_type,
         p.parent_id,
         p.sort_order,
         pa.action_key
       FROM pages AS p
       JOIN page_actions AS pa ON pa.page_id = p.id
       JOIN role_page_permissions AS rpp
         ON rpp.page_action_id = pa.id
        AND rpp.role_id = $1
       WHERE p.is_active = true
         AND p.is_menu_item = true
         AND EXISTS (
           SELECT 1
           FROM page_actions AS view_action
           JOIN role_page_permissions AS view_permission
             ON view_permission.page_action_id = view_action.id
            AND view_permission.role_id = $1
           WHERE view_action.page_id = p.id
             AND view_action.action_key = 'view'
         )
       ORDER BY p.sort_order, p.id, pa.id`,
      [user.role_id],
    )

    const pagesById = new Map()

    for (const row of navigationResult.rows) {
      const page = pagesById.get(row.id) || {
        id: row.id,
        pageKey: row.page_key,
        displayName: row.display_name,
        route: row.route,
        iconKey: row.icon_key,
        pageType: row.page_type,
        parentId: row.parent_id,
        sortOrder: row.sort_order,
        actions: {},
      }

      page.actions[row.action_key] = true
      pagesById.set(row.id, page)
    }

    sendJson(response, 200, { status: 'ok', pages: [...pagesById.values()] })
    return true
  }

  if (request.method === 'POST' && request.url === '/auth/logout') {
    const token = getSessionToken(request)

    if (token) {
      await pool.query(
        'UPDATE auth_sessions SET revoked_at = now() WHERE token_hash = $1',
        [hashSessionToken(token)],
      )
    }

    response.setHeader('Set-Cookie', sessionCookie('', 0))
    sendJson(response, 200, { status: 'ok' })
    return true
  }

  return false
}
