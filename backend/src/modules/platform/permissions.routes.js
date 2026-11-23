import { pool } from '../../shared/db.js'
import { requireAuthenticated } from '../../shared/auth.js'
import { readJsonBody, sendJson } from '../../shared/http.js'

const roleSelect = `
  SELECT r.id, r.role_key, r.role_name, r.scope, r.tenant_id,
    r.is_active, t.display_name AS tenant_name
  FROM roles AS r
  LEFT JOIN tenants AS t ON t.id = r.tenant_id
`

const serializeRole = (role, user) => ({
  id: role.id,
  roleKey: role.role_key,
  roleName: role.role_name,
  scope: role.scope,
  tenantId: role.tenant_id,
  tenantName: role.tenant_name,
  isActive: role.is_active,
  isDefault: role.scope === 'tenant' && role.tenant_id === null,
  canManage: user.role_key === 'superadmin'
    ? role.role_key !== 'superadmin'
    : role.scope === 'tenant'
      && role.tenant_id !== null
      && String(role.tenant_id) === String(user.tenant_id),
})

const requirePermissionPageAction = async (request, response, actionKey) => {
  const user = await requireAuthenticated(request, response)
  if (!user) return null

  if (user.role_key === 'superadmin') return user

  const permissionResult = await pool.query(
    `SELECT 1
     FROM pages AS p
     JOIN page_actions AS pa ON pa.page_id = p.id
     JOIN role_page_permissions AS rpp
       ON rpp.page_action_id = pa.id
      AND rpp.role_id = $1
     WHERE p.page_key = 'permissions'
       AND p.is_active = true
       AND pa.action_key = $2`,
    [user.role_id, actionKey],
  )

  if (permissionResult.rowCount === 0) {
    sendJson(response, 403, { error: 'You do not have permission to manage permissions' })
    return null
  }

  return user
}

const getQueryValue = (request, key) => {
  const url = new URL(request.url, 'http://localhost')
  return url.searchParams.get(key)
}

const parseOptionalId = (value) => {
  if (value === null || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const loadRoles = async (user, tenantId) => {
  if (user.role_key === 'superadmin' && tenantId === null) return []

  const condition = user.role_key === 'superadmin'
    ? `r.is_active = true
       AND r.scope = 'tenant'
       AND (r.tenant_id IS NULL OR r.tenant_id = $1)`
    : `r.is_active = true
       AND r.scope = 'tenant'
       AND (r.tenant_id IS NULL OR r.tenant_id = $1)`

  const result = await pool.query(
    `${roleSelect}
     WHERE ${condition}
     ORDER BY r.tenant_id NULLS FIRST, r.role_name, r.id`,
    [tenantId],
  )

  return result.rows.map((role) => serializeRole(role, user))
}

const loadPages = async (roleId) => {
  const result = await pool.query(
    `SELECT
       p.id,
       p.page_key,
       p.display_name,
       p.route,
       p.page_type,
       COALESCE(
         json_agg(
           json_build_object(
             'key', pa.action_key,
             'name', pa.action_name,
             'granted', rpp.role_id IS NOT NULL
           ) ORDER BY pa.id
         ) FILTER (WHERE pa.id IS NOT NULL),
         '[]'::json
       ) AS actions
     FROM pages AS p
     LEFT JOIN page_actions AS pa ON pa.page_id = p.id
     LEFT JOIN role_page_permissions AS rpp
       ON rpp.page_action_id = pa.id
      AND rpp.role_id = $1
     WHERE p.is_active = true
       AND p.page_type = 'tenant'
     GROUP BY p.id
     ORDER BY p.sort_order, p.id`,
    [roleId],
  )

  return result.rows.map((page) => ({
    id: page.id,
    pageKey: page.page_key,
    displayName: page.display_name,
    route: page.route,
    pageType: page.page_type,
    actions: page.actions,
  }))
}

export const handlePermissionRoutes = async (request, response) => {
  if (request.method === 'GET' && request.url.startsWith('/auth/permissions')) {
    const user = await requirePermissionPageAction(request, response, 'view')
    if (!user) return true

    const requestedTenantId = parseOptionalId(getQueryValue(request, 'tenantId'))
    if (requestedTenantId === undefined) {
      sendJson(response, 400, { error: 'Tenant ID is invalid' })
      return true
    }

    const tenantId = user.role_key === 'superadmin'
      ? requestedTenantId
      : Number(user.tenant_id)

    if (user.role_key === 'superadmin' && tenantId !== null) {
      const tenantResult = await pool.query(
        `SELECT id, display_name
         FROM tenants
         WHERE id = $1 AND status = 'active'`,
        [tenantId],
      )
      if (tenantResult.rowCount === 0) {
        sendJson(response, 400, { error: 'Tenant not found or inactive' })
        return true
      }
    }

    const tenantsResult = user.role_key === 'superadmin'
      ? await pool.query(
        `SELECT id, display_name
         FROM tenants
         WHERE status = 'active'
         ORDER BY display_name, id`,
      )
      : { rows: [] }
    const roles = await loadRoles(user, tenantId)
    const requestedRoleId = parseOptionalId(getQueryValue(request, 'roleId'))

    if (requestedRoleId === undefined) {
      sendJson(response, 400, { error: 'Role ID is invalid' })
      return true
    }

    const selectedRole = requestedRoleId === null
      ? null
      : roles.find((role) => String(role.id) === String(requestedRoleId))

    if (requestedRoleId !== null && !selectedRole) {
      sendJson(response, 404, { error: 'Role not found for the selected tenant' })
      return true
    }

    sendJson(response, 200, {
      status: 'ok',
      tenants: tenantsResult.rows.map((tenant) => ({ id: tenant.id, displayName: tenant.display_name })),
      roles,
      pages: selectedRole ? await loadPages(selectedRole.id) : [],
    })
    return true
  }

  const updateMatch = request.url?.match(/^\/auth\/permissions\/(\d+)$/)
  if (request.method === 'PUT' && updateMatch) {
    const user = await requirePermissionPageAction(request, response, 'update')
    if (!user) return true

    const roleResult = await pool.query(`${roleSelect} WHERE r.id = $1`, [updateMatch[1]])
    const role = roleResult.rows[0]
    if (!role) {
      sendJson(response, 404, { error: 'Role not found' })
      return true
    }
    if (!role.is_active) {
      sendJson(response, 400, { error: 'Inactive roles cannot be assigned permissions' })
      return true
    }
    if (role.role_key === 'superadmin') {
      sendJson(response, 403, { error: 'Super Admin permissions cannot be changed' })
      return true
    }
    if (user.role_key !== 'superadmin' && (
      role.scope !== 'tenant'
      || role.tenant_id === null
      || String(role.tenant_id) !== String(user.tenant_id)
    )) {
      sendJson(response, 403, { error: 'Default roles or other tenant roles are read-only' })
      return true
    }

    const body = await readJsonBody(request)
    if (!Array.isArray(body.permissions)) {
      sendJson(response, 400, { error: 'Permissions must be an array' })
      return true
    }

    const actionResult = await pool.query(
      `SELECT pa.page_id, pa.action_key
       FROM page_actions AS pa
       JOIN pages AS p ON p.id = pa.page_id
       WHERE p.is_active = true
         AND p.page_type = 'tenant'`,
    )
    const validActions = new Set(actionResult.rows.map((action) => `${action.page_id}:${action.action_key}`))
    const permissionSet = new Set()

    for (const permission of body.permissions) {
      const pageId = Number(permission?.pageId)
      const actions = Array.isArray(permission?.actions) ? permission.actions : []

      if (!Number.isInteger(pageId) || pageId < 1 || actions.some((action) => typeof action !== 'string' || !validActions.has(`${pageId}:${action}`))) {
        sendJson(response, 400, { error: 'One or more page permissions are invalid' })
        return true
      }

      for (const action of actions) permissionSet.add(`${pageId}:${action}`)
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM role_page_permissions WHERE role_id = $1', [role.id])

      const permissions = [...permissionSet]
      if (permissions.length > 0) {
        const values = []
        const placeholders = permissions.map((permission, index) => {
          const [pageId, actionKey] = permission.split(':')
          values.push(role.id, pageId, actionKey)
          const offset = index * 3
          return `($${offset + 1}, (SELECT id FROM page_actions WHERE page_id = $${offset + 2} AND action_key = $${offset + 3}))`
        }).join(', ')

        await client.query(
          `INSERT INTO role_page_permissions (role_id, page_action_id)
           VALUES ${placeholders}
           ON CONFLICT (role_id, page_action_id) DO NOTHING`,
          values,
        )
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    sendJson(response, 200, {
      status: 'ok',
      role: serializeRole(role, user),
      permissions: [...permissionSet].map((permission) => {
        const [pageId, actionKey] = permission.split(':')
        return { pageId: Number(pageId), actionKey }
      }),
    })
    return true
  }

  return false
}
