import { pool } from '../../shared/db.js'
import { requireAuthenticated } from '../../shared/auth.js'
import { readJsonBody, sendJson } from '../../shared/http.js'

const roleKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const serializeRole = (role) => ({
  id: role.id,
  roleKey: role.role_key,
  roleName: role.role_name,
  scope: role.scope,
  tenantId: role.tenant_id,
  tenantName: role.tenant_name,
  isActive: role.is_active,
  isDefault: role.scope === 'tenant' && role.tenant_id === null,
  canManage: role.can_manage,
})

const requireRolePageAction = async (request, response, actionKey) => {
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
     WHERE p.page_key = 'roles'
       AND p.is_active = true
       AND pa.action_key = $2`,
    [user.role_id, actionKey],
  )

  if (permissionResult.rowCount === 0) {
    sendJson(response, 403, { error: 'You do not have permission to manage roles' })
    return null
  }

  return user
}

const roleSelect = `
  SELECT r.id, r.role_key, r.role_name, r.scope, r.tenant_id,
    r.is_active, t.display_name AS tenant_name
  FROM roles AS r
  LEFT JOIN tenants AS t ON t.id = r.tenant_id
`

export const handleRoleRoutes = async (request, response) => {
  if (request.method === 'GET' && request.url === '/auth/roles') {
    const user = await requireRolePageAction(request, response, 'view')
    if (!user) return true

    const visibility = user.role_key === 'superadmin'
      ? ''
      : `WHERE r.scope = 'tenant'
           AND (r.tenant_id IS NULL OR r.tenant_id = $1)`
    const values = user.role_key === 'superadmin' ? [] : [user.tenant_id]
    const result = await pool.query(
      `${roleSelect}
       ${visibility}
       ORDER BY r.scope, r.role_name, r.id`,
      values,
    )

    sendJson(response, 200, {
      status: 'ok',
      roles: result.rows.map((role) => serializeRole({
        ...role,
        can_manage: user.role_key === 'superadmin'
          ? role.role_key !== 'superadmin'
          : String(role.tenant_id) === String(user.tenant_id),
      })),
    })
    return true
  }

  if (request.method === 'POST' && request.url === '/auth/roles') {
    const user = await requireRolePageAction(request, response, 'create')
    if (!user) return true

    const body = await readJsonBody(request)
    const roleKey = typeof body.roleKey === 'string' ? body.roleKey.trim().toLowerCase() : ''
    const roleName = typeof body.roleName === 'string' ? body.roleName.trim() : ''
    const scope = user.role_key === 'superadmin'
      ? (body.scope === 'platform' ? 'platform' : 'tenant')
      : 'tenant'
    const tenantId = user.role_key === 'superadmin'
      ? (body.tenantId === '' || body.tenantId == null ? null : Number(body.tenantId))
      : Number(user.tenant_id)

    if (!roleName || !roleKeyPattern.test(roleKey)) {
      sendJson(response, 400, { error: 'Role name and a valid role key are required' })
      return true
    }

    if (tenantId !== null && (!Number.isInteger(tenantId) || tenantId < 1)) {
      sendJson(response, 400, { error: 'Tenant ID is invalid' })
      return true
    }

    if (scope === 'platform' && tenantId !== null) {
      sendJson(response, 400, { error: 'Platform roles cannot be assigned to a tenant' })
      return true
    }

    if (tenantId !== null) {
      const tenantResult = await pool.query('SELECT 1 FROM tenants WHERE id = $1', [tenantId])
      if (tenantResult.rowCount === 0) {
        sendJson(response, 400, { error: 'Tenant not found' })
        return true
      }
    }

    try {
      const result = await pool.query(
        `INSERT INTO roles (role_key, role_name, scope, tenant_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [roleKey, roleName, scope, tenantId],
      )
      const roleResult = await pool.query(`${roleSelect} WHERE r.id = $1`, [result.rows[0].id])

      sendJson(response, 201, {
        status: 'ok',
        role: serializeRole({ ...roleResult.rows[0], can_manage: true }),
      })
    } catch (error) {
      if (error.code === '23505') {
        sendJson(response, 409, { error: 'A role with this key already exists in the selected scope' })
        return true
      }
      throw error
    }

    return true
  }

  const editMatch = request.url?.match(/^\/auth\/roles\/(\d+)$/)
  if (request.method === 'PATCH' && editMatch) {
    const user = await requireRolePageAction(request, response, 'update')
    if (!user) return true

    const existingRoleResult = await pool.query(`${roleSelect} WHERE r.id = $1`, [editMatch[1]])
    const existingRole = existingRoleResult.rows[0]
    if (!existingRole) {
      sendJson(response, 404, { error: 'Role not found' })
      return true
    }
    if (existingRole.role_key === 'superadmin') {
      sendJson(response, 403, { error: 'Super Admin cannot be changed' })
      return true
    }
    if (user.role_key !== 'superadmin' && String(existingRole.tenant_id) !== String(user.tenant_id)) {
      sendJson(response, 403, { error: 'Default roles are read-only' })
      return true
    }

    const body = await readJsonBody(request)
    const roleName = typeof body.roleName === 'string' ? body.roleName.trim() : ''
    const scope = user.role_key === 'superadmin'
      ? (body.scope === 'platform' ? 'platform' : 'tenant')
      : 'tenant'
    const tenantId = user.role_key === 'superadmin'
      ? (body.tenantId === '' || body.tenantId == null ? null : Number(body.tenantId))
      : Number(user.tenant_id)

    if (!roleName) {
      sendJson(response, 400, { error: 'Role name is required' })
      return true
    }
    if (tenantId !== null && (!Number.isInteger(tenantId) || tenantId < 1)) {
      sendJson(response, 400, { error: 'Tenant ID is invalid' })
      return true
    }
    if (scope === 'platform' && tenantId !== null) {
      sendJson(response, 400, { error: 'Platform roles cannot be assigned to a tenant' })
      return true
    }
    if (tenantId !== null) {
      const tenantResult = await pool.query('SELECT 1 FROM tenants WHERE id = $1', [tenantId])
      if (tenantResult.rowCount === 0) {
        sendJson(response, 400, { error: 'Tenant not found' })
        return true
      }
    }

    const result = await pool.query(
      `UPDATE roles
       SET role_name = $1, scope = $2, tenant_id = $3
       WHERE id = $4 AND role_key <> 'superadmin'
       RETURNING id`,
      [roleName, scope, tenantId, editMatch[1]],
    )

    if (result.rowCount === 0) {
      sendJson(response, 404, { error: 'Role not found or cannot be changed' })
      return true
    }

    const roleResult = await pool.query(`${roleSelect} WHERE r.id = $1`, [result.rows[0].id])
    sendJson(response, 200, {
      status: 'ok',
      role: serializeRole({ ...roleResult.rows[0], can_manage: true }),
    })
    return true
  }

  const statusMatch = request.url?.match(/^\/auth\/roles\/(\d+)\/status$/)
  if (request.method === 'PATCH' && statusMatch) {
    const user = await requireRolePageAction(request, response, 'update')
    if (!user) return true

    const existingRoleResult = await pool.query(`${roleSelect} WHERE r.id = $1`, [statusMatch[1]])
    const existingRole = existingRoleResult.rows[0]
    if (!existingRole) {
      sendJson(response, 404, { error: 'Role not found' })
      return true
    }
    if (existingRole.role_key === 'superadmin') {
      sendJson(response, 403, { error: 'Super Admin cannot be disabled' })
      return true
    }
    if (user.role_key !== 'superadmin' && String(existingRole.tenant_id) !== String(user.tenant_id)) {
      sendJson(response, 403, { error: 'Default roles are read-only' })
      return true
    }

    const { isActive } = await readJsonBody(request)
    if (typeof isActive !== 'boolean') {
      sendJson(response, 400, { error: 'isActive must be a boolean' })
      return true
    }

    const result = await pool.query(
      `UPDATE roles
       SET is_active = $1
       WHERE id = $2
         AND role_key <> 'superadmin'
       RETURNING id`,
      [isActive, statusMatch[1]],
    )

    if (result.rowCount === 0) {
      sendJson(response, 404, { error: 'Role not found or cannot be changed' })
      return true
    }

    const roleResult = await pool.query(`${roleSelect} WHERE r.id = $1`, [result.rows[0].id])
    sendJson(response, 200, {
      status: 'ok',
      role: serializeRole({ ...roleResult.rows[0], can_manage: true }),
    })
    return true
  }

  return false
}
