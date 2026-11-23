import { pool } from '../../shared/db.js'
import { requireSuperadmin } from '../../shared/auth.js'
import { readJsonBody, sendJson } from '../../shared/http.js'

const serializePlan = (plan) => ({
  id: plan.id,
  planCode: plan.plan_code,
  planName: plan.plan_name,
  description: plan.description,
  durationDays: plan.duration_days,
  warningBeforeExpiryDays: plan.warning_before_expiry_days,
  features: plan.features,
  isActive: plan.is_active,
})

export const handlePlanRoutes = async (request, response) => {
  if (request.method === 'GET' && request.url === '/auth/plans') {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const result = await pool.query(
      `SELECT id, plan_code, plan_name, description, duration_days,
         warning_before_expiry_days, features, is_active
       FROM plans
       ORDER BY id`,
    )

    sendJson(response, 200, { status: 'ok', plans: result.rows.map(serializePlan) })
    return true
  }

  if (request.method === 'POST' && request.url === '/auth/plans') {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const body = await readJsonBody(request)
    const planCode = typeof body.planCode === 'string' ? body.planCode.trim().toLowerCase() : ''
    const planName = typeof body.planName === 'string' ? body.planName.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : null
    const durationDays = Number(body.durationDays)
    const warningBeforeExpiryDays = Number(body.warningBeforeExpiryDays)
    const features = body.features && typeof body.features === 'object' ? body.features : {}

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(planCode) || !planName) {
      sendJson(response, 400, { error: 'Plan code and plan name are required' })
      return true
    }

    if (!Number.isInteger(durationDays) || durationDays < 1) {
      sendJson(response, 400, { error: 'Plan duration must be a positive integer' })
      return true
    }

    if (!Number.isInteger(warningBeforeExpiryDays) || warningBeforeExpiryDays < 0 || warningBeforeExpiryDays >= durationDays) {
      sendJson(response, 400, { error: 'Warning days must be zero or more and less than the plan duration' })
      return true
    }

    try {
      const result = await pool.query(
        `INSERT INTO plans (
           plan_code, plan_name, description, duration_days,
           warning_before_expiry_days, features
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, plan_code, plan_name, description, duration_days,
           warning_before_expiry_days, features, is_active`,
        [planCode, planName, description || null, durationDays, warningBeforeExpiryDays, JSON.stringify(features)],
      )

      sendJson(response, 201, { status: 'ok', plan: serializePlan(result.rows[0]) })
    } catch (error) {
      if (error.code === '23505') {
        sendJson(response, 409, { error: 'Plan code already exists' })
        return true
      }
      throw error
    }

    return true
  }

  const statusMatch = request.url?.match(/^\/auth\/plans\/(\d+)\/status$/)

  if (request.method === 'PATCH' && statusMatch) {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const { isActive } = await readJsonBody(request)
    if (typeof isActive !== 'boolean') {
      sendJson(response, 400, { error: 'isActive must be a boolean' })
      return true
    }

    const result = await pool.query(
      `UPDATE plans
       SET is_active = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, plan_code, plan_name, is_active`,
      [isActive, statusMatch[1]],
    )

    if (result.rowCount === 0) {
      sendJson(response, 404, { error: 'Plan not found' })
      return true
    }

    sendJson(response, 200, { status: 'ok', plan: result.rows[0] })
    return true
  }

  return false
}
