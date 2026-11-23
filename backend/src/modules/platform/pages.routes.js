import { pool } from '../../shared/db.js'
import { requireSuperadmin } from '../../shared/auth.js'
import { readJsonBody, sendJson } from '../../shared/http.js'

const serializePage = (page) => ({
  id: page.id,
  pageKey: page.page_key,
  displayName: page.display_name,
  route: page.route,
  iconKey: page.icon_key,
  pageType: page.page_type,
  parentId: page.parent_id,
  sortOrder: page.sort_order,
  isMenuItem: page.is_menu_item,
  isActive: page.is_active,
  actions: page.actions || [],
})

const validatePage = (body) => {
  const pageKey = typeof body.pageKey === 'string' ? body.pageKey.trim().toLowerCase() : ''
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const route = typeof body.route === 'string' ? body.route.trim() : ''
  const pageType = typeof body.pageType === 'string' ? body.pageType : ''
  const iconKey = typeof body.iconKey === 'string' ? body.iconKey : ''
  const sortOrder = Number(body.sortOrder ?? 0)

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageKey)) {
    return { error: 'Page name must use lowercase letters, numbers, and hyphens' }
  }
  if (!displayName || !route.startsWith('/app/')) {
    return { error: 'Display name and an /app/ route are required' }
  }
  if (!['platform', 'tenant'].includes(pageType)) {
    return { error: 'Page type must be platform or tenant' }
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return { error: 'Sort order must be a non-negative integer' }
  }

  return { pageKey, displayName, route, pageType, iconKey, sortOrder }
}

const actionDefinitions = [
  { key: 'view', name: 'View' },
  { key: 'create', name: 'Create' },
  { key: 'update', name: 'Update' },
  { key: 'delete', name: 'Delete' },
  { key: 'export', name: 'Export' },
]

const insertPageActions = async (client, pageId, actions) => {
  if (actions.length === 0) return

  const actionValues = actions
    .map((_, index) => `($1, $${index * 2 + 2}, $${index * 2 + 3})`)
    .join(', ')
  const actionParameters = [pageId, ...actions.flatMap((action) => [action.key, action.name])]

  await client.query(
    `INSERT INTO page_actions (page_id, action_key, action_name)
     VALUES ${actionValues}
     ON CONFLICT (page_id, action_key) DO NOTHING`,
    actionParameters,
  )
}

export const handlePageRoutes = async (request, response) => {
  if (request.method === 'GET' && request.url === '/auth/pages') {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const [result, actionsResult] = await Promise.all([
      pool.query(
      `SELECT id, page_key, display_name, route, icon_key, page_type,
         parent_id, sort_order, is_menu_item, is_active
       FROM pages
       ORDER BY sort_order, id`,
      ),
      pool.query('SELECT page_id, action_key FROM page_actions ORDER BY id'),
    ])
    const actionsByPage = new Map()
    for (const action of actionsResult.rows) {
      const actions = actionsByPage.get(action.page_id) || []
      actions.push(action.action_key)
      actionsByPage.set(action.page_id, actions)
    }

    sendJson(response, 200, {
      status: 'ok',
      pages: result.rows.map((page) => serializePage({ ...page, actions: actionsByPage.get(page.id) || [] })),
    })
    return true
  }

  if (request.method === 'POST' && request.url === '/auth/pages') {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const body = await readJsonBody(request)
    const data = validatePage(body)
    if (data.error) {
      sendJson(response, 400, { error: data.error })
      return true
    }

    const actions = Array.isArray(body.actions) ? [...new Set(body.actions)] : []
    const selectedActions = actionDefinitions.filter((action) => actions.includes(action.key))

    if (selectedActions.length === 0) {
      sendJson(response, 400, { error: 'Select at least one action permission' })
      return true
    }

    if (selectedActions.length !== actions.length) {
      sendJson(response, 400, { error: 'One or more action permissions are invalid' })
      return true
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `INSERT INTO pages (page_key, display_name, route, icon_key, page_type, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, page_key, display_name, route, icon_key, page_type,
           parent_id, sort_order, is_menu_item, is_active`,
        [data.pageKey, data.displayName, data.route, data.iconKey || null, data.pageType, data.sortOrder],
      )
      const page = result.rows[0]

      await insertPageActions(client, page.id, selectedActions)
      await client.query(
        `INSERT INTO role_page_permissions (role_id, page_action_id)
         SELECT r.id, pa.id
         FROM roles AS r
         JOIN page_actions AS pa ON pa.page_id = $1
         WHERE r.role_key = 'superadmin'
         ON CONFLICT (role_id, page_action_id) DO NOTHING`,
        [page.id],
      )
      await client.query('COMMIT')
      sendJson(response, 201, { status: 'ok', page: serializePage({ ...page, actions: selectedActions.map((action) => action.key) }) })
    } catch (error) {
      await client.query('ROLLBACK')
      if (error.code === '23505') {
        sendJson(response, 409, { error: 'Page name or route already exists' })
        return true
      }
      throw error
    } finally {
      client.release()
    }
    return true
  }

  const pageEditMatch = request.url?.match(/^\/auth\/pages\/(\d+)$/)
  if (request.method === 'PATCH' && pageEditMatch) {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const body = await readJsonBody(request)
    const data = validatePage(body)
    if (data.error) {
      sendJson(response, 400, { error: data.error })
      return true
    }

    const existingActionsResult = await pool.query(
      'SELECT action_key FROM page_actions WHERE page_id = $1 ORDER BY id',
      [pageEditMatch[1]],
    )
    const existingActions = existingActionsResult.rows.map((action) => action.action_key)
    const requestedActions = Array.isArray(body.actions) ? [...new Set(body.actions)] : existingActions
    const selectedActions = actionDefinitions.filter((action) => requestedActions.includes(action.key))

    if (selectedActions.length !== requestedActions.length) {
      sendJson(response, 400, { error: 'One or more action permissions are invalid' })
      return true
    }

    if (existingActions.some((action) => !requestedActions.includes(action))) {
      sendJson(response, 400, { error: 'Existing action permissions cannot be removed' })
      return true
    }

    if (existingActions.length === 0 && selectedActions.length === 0) {
      sendJson(response, 400, { error: 'Select at least one action permission' })
      return true
    }

    try {
      const result = await pool.query(
        `UPDATE pages
         SET page_key = $1, display_name = $2, route = $3, icon_key = $4,
             page_type = $5, sort_order = $6, updated_at = now()
         WHERE id = $7
         RETURNING id, page_key, display_name, route, icon_key, page_type,
           parent_id, sort_order, is_menu_item, is_active`,
        [data.pageKey, data.displayName, data.route, data.iconKey || null, data.pageType, data.sortOrder, pageEditMatch[1]],
      )

      if (result.rowCount === 0) {
        sendJson(response, 404, { error: 'Page not found' })
        return true
      }

      await insertPageActions(pool, pageEditMatch[1], selectedActions)
      await pool.query(
        `INSERT INTO role_page_permissions (role_id, page_action_id)
         SELECT r.id, pa.id
         FROM roles AS r
         JOIN page_actions AS pa ON pa.page_id = $1
         WHERE r.role_key = 'superadmin'
         ON CONFLICT (role_id, page_action_id) DO NOTHING`,
        [pageEditMatch[1]],
      )

      const actionsForPage = await pool.query(
        'SELECT action_key FROM page_actions WHERE page_id = $1 ORDER BY id',
        [pageEditMatch[1]],
      )
      sendJson(response, 200, { status: 'ok', page: serializePage({ ...result.rows[0], actions: actionsForPage.rows.map((action) => action.action_key) }) })
    } catch (error) {
      if (error.code === '23505') {
        sendJson(response, 409, { error: 'Page name or route already exists' })
        return true
      }
      throw error
    }
    return true
  }

  const statusMatch = request.url?.match(/^\/auth\/pages\/(\d+)\/status$/)
  if (request.method === 'PATCH' && statusMatch) {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const { isActive } = await readJsonBody(request)
    if (typeof isActive !== 'boolean') {
      sendJson(response, 400, { error: 'isActive must be a boolean' })
      return true
    }

    const result = await pool.query(
      `UPDATE pages
       SET is_active = $1, is_menu_item = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, page_key, display_name, is_active`,
      [isActive, statusMatch[1]],
    )

    if (result.rowCount === 0) {
      sendJson(response, 404, { error: 'Page not found' })
      return true
    }

    sendJson(response, 200, { status: 'ok', page: result.rows[0] })
    return true
  }

  return false
}
