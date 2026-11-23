import argon2 from 'argon2'
import { pool } from '../../shared/db.js'
import { requireSuperadmin } from '../../shared/auth.js'
import { readJsonBody, sendJson } from '../../shared/http.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const tenantKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const isValidPhone = (value) => {
  if (!value) return true
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15 && /^[+\d()\s-]+$/.test(value)
}

const validateLogoData = (value) => {
  if (!value) return null
  if (typeof value !== 'string') return 'Logo image is invalid'

  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/)
  if (!match) return 'Logo must be a PNG, JPEG, or WebP image'
  if (Buffer.byteLength(match[2], 'base64') > 2 * 1024 * 1024) return 'Logo image must be 2 MB or smaller'

  return null
}

const serializeTenant = (tenant) => ({
  id: tenant.id,
  tenantKey: tenant.tenant_key || tenant.slug,
  legalName: tenant.legal_name,
  displayName: tenant.display_name || tenant.legal_name || tenant.name,
  email: tenant.email,
  phone: tenant.phone,
  country: tenant.country,
  taxNumber: tenant.tax_number,
  logoUrl: tenant.logo_url,
  addressLine1: tenant.address_line_1,
  addressLine2: tenant.address_line_2,
  city: tenant.city,
  state: tenant.state,
  postalCode: tenant.postal_code,
  addressCountry: tenant.address_country,
  status: tenant.status,
  planId: tenant.plan_id,
  planCode: tenant.plan_code,
  planName: tenant.plan_name,
  durationDays: tenant.duration_days,
  warningBeforeExpiryDays: tenant.warning_before_expiry_days,
  subscriptionStatus: tenant.subscription_status,
  subscriptionStartedAt: tenant.started_at,
  subscriptionEndsAt: tenant.ends_at,
  administratorName: tenant.administrator_name,
  administratorEmail: tenant.administrator_email,
})

export const handleTenantRoutes = async (request, response) => {
  if (request.method === 'GET' && request.url === '/auth/tenants') {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const result = await pool.query(
      `SELECT
         t.id,
         t.slug AS tenant_key,
         t.legal_name,
         t.display_name,
         t.name,
         t.email,
         t.phone,
         t.country,
         t.tax_number,
         t.logo_url,
         t.status,
         address.address_line_1,
         address.address_line_2,
         address.city,
         address.state,
         address.postal_code,
         address.country AS address_country,
         p.id AS plan_id,
         p.plan_code,
         p.plan_name,
         p.duration_days,
         p.warning_before_expiry_days,
         current_subscription.status AS subscription_status,
         current_subscription.started_at,
         current_subscription.ends_at,
         administrator.full_name AS administrator_name,
         administrator.email AS administrator_email
       FROM tenants AS t
       LEFT JOIN tenant_addresses AS address ON address.tenant_id = t.id
       LEFT JOIN LATERAL (
         SELECT ts.plan_id, ts.status, ts.started_at, ts.ends_at
         FROM tenant_subscriptions AS ts
         WHERE ts.tenant_id = t.id
           AND ts.status IN ('trialing', 'active')
         ORDER BY ts.id DESC
         LIMIT 1
       ) AS current_subscription ON true
       LEFT JOIN plans AS p ON p.id = current_subscription.plan_id
       LEFT JOIN LATERAL (
         SELECT u.full_name, u.email
         FROM users AS u
         JOIN roles AS r ON r.id = u.role_id
         WHERE u.tenant_id = t.id
           AND r.role_key = 'administrator'
         ORDER BY u.id
         LIMIT 1
       ) AS administrator ON true
       ORDER BY t.id DESC`,
    )

    sendJson(response, 200, { status: 'ok', tenants: result.rows.map(serializeTenant) })
    return true
  }

  if (request.method === 'POST' && request.url === '/auth/tenants') {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const body = await readJsonBody(request)
    const legalName = typeof body.legalName === 'string' ? body.legalName.trim() : ''
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
    const tenantKey = typeof body.tenantKey === 'string' ? body.tenantKey.trim().toLowerCase() : ''
    const companyEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const country = typeof body.country === 'string' ? body.country.trim() : ''
    const taxNumber = typeof body.taxNumber === 'string' ? body.taxNumber.trim() : ''
    const logoData = body.logoData || null
    const administratorName = typeof body.administratorName === 'string' ? body.administratorName.trim() : ''
    const administratorEmail = typeof body.administratorEmail === 'string'
      ? body.administratorEmail.trim().toLowerCase()
      : ''
    const administratorPassword = typeof body.administratorPassword === 'string' ? body.administratorPassword : ''
    const planId = Number(body.planId)
    const address = body.address && typeof body.address === 'object' ? body.address : {}

    if (legalName.length < 2 || displayName.length < 2 || !tenantKeyPattern.test(tenantKey)) {
      sendJson(response, 400, { error: 'Legal name, display name, and a valid tenant code are required' })
      return true
    }

    if (!emailPattern.test(administratorEmail)) {
      sendJson(response, 400, { error: 'Administrator email is invalid' })
      return true
    }

    if (companyEmail && !emailPattern.test(companyEmail)) {
      sendJson(response, 400, { error: 'Company email is invalid' })
      return true
    }

    if (!isValidPhone(phone)) {
      sendJson(response, 400, { error: 'Phone number is invalid' })
      return true
    }
    const logoError = validateLogoData(logoData)
    if (logoError) {
      sendJson(response, 400, { error: logoError })
      return true
    }

    if (administratorName.length < 2 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(administratorPassword)) {
      sendJson(response, 400, { error: 'Administrator name is required and password must contain 8 characters, uppercase, lowercase, and a number' })
      return true
    }

    if (!Number.isInteger(planId) || planId < 1) {
      sendJson(response, 400, { error: 'A valid plan is required' })
      return true
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const planResult = await client.query(
        `SELECT id, plan_code, plan_name, duration_days, warning_before_expiry_days
         FROM plans
         WHERE id = $1 AND is_active = true`,
        [planId],
      )

      if (planResult.rowCount === 0) {
        await client.query('ROLLBACK')
        sendJson(response, 400, { error: 'Selected plan is not available' })
        return true
      }

      const tenantResult = await client.query(
        `INSERT INTO tenants (
           name, slug, legal_name, display_name, email, phone, country, tax_number, logo_url
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, slug, legal_name, display_name, email, phone, country, tax_number, logo_url, status`,
        [displayName, tenantKey, legalName, displayName, companyEmail || null, phone || null, country || null, taxNumber || null, logoData],
      )
      const tenant = tenantResult.rows[0]

      await client.query(
        `INSERT INTO tenant_addresses (
           tenant_id, address_line_1, address_line_2, city, state, postal_code, country
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenant.id, address.addressLine1 || null, address.addressLine2 || null, address.city || null, address.state || null, address.postalCode || null, address.country || country || null],
      )

      const roleResult = await client.query(
        `SELECT id FROM roles WHERE role_key = 'administrator' AND scope = 'tenant'`,
      )
      const passwordHash = await argon2.hash(administratorPassword, { type: argon2.argon2id })

      await client.query(
        `INSERT INTO users (tenant_id, role_id, full_name, email, password_hash)
         VALUES ($1, $2, $3, $4, $5)`,
        [tenant.id, roleResult.rows[0].id, administratorName, administratorEmail, passwordHash],
      )

      const subscriptionResult = await client.query(
        `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, started_at, ends_at)
         VALUES ($1, $2, 'active', now(), now() + ($3::int * interval '1 day'))
         RETURNING started_at, ends_at`,
        [tenant.id, planId, planResult.rows[0].duration_days],
      )

      await client.query('COMMIT')

      sendJson(response, 201, {
        status: 'ok',
        tenant: serializeTenant({
          ...tenant,
          tenant_key: tenant.slug,
          plan_id: planId,
          plan_code: planResult.rows[0].plan_code,
          plan_name: planResult.rows[0].plan_name,
          duration_days: planResult.rows[0].duration_days,
          warning_before_expiry_days: planResult.rows[0].warning_before_expiry_days,
          subscription_status: 'active',
          started_at: subscriptionResult.rows[0].started_at,
          ends_at: subscriptionResult.rows[0].ends_at,
          administrator_name: administratorName,
          administrator_email: administratorEmail,
        }),
      })
    } catch (error) {
      await client.query('ROLLBACK')

      if (error.code === '23505') {
        sendJson(response, 409, { error: 'Tenant code or user email already exists' })
        return true
      }

      throw error
    } finally {
      client.release()
    }

    return true
  }

  const tenantEditMatch = request.url?.match(/^\/auth\/tenants\/(\d+)$/)

  if (request.method === 'PATCH' && tenantEditMatch) {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const body = await readJsonBody(request)
    const legalName = typeof body.legalName === 'string' ? body.legalName.trim() : ''
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
    const tenantKey = typeof body.tenantKey === 'string' ? body.tenantKey.trim().toLowerCase() : ''
    const companyEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const country = typeof body.country === 'string' ? body.country.trim() : ''
    const taxNumber = typeof body.taxNumber === 'string' ? body.taxNumber.trim() : ''
    const logoData = body.logoData || null
    const address = body.address && typeof body.address === 'object' ? body.address : {}

    if (legalName.length < 2 || displayName.length < 2 || !tenantKeyPattern.test(tenantKey)) {
      sendJson(response, 400, { error: 'Legal name, display name, and a valid tenant code are required' })
      return true
    }
    if (companyEmail && !emailPattern.test(companyEmail)) {
      sendJson(response, 400, { error: 'Company email is invalid' })
      return true
    }
    if (!isValidPhone(phone)) {
      sendJson(response, 400, { error: 'Phone number is invalid' })
      return true
    }
    const logoError = validateLogoData(logoData)
    if (logoError) {
      sendJson(response, 400, { error: logoError })
      return true
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const tenantResult = await client.query(
        `UPDATE tenants
         SET name = $1, slug = $2, legal_name = $3, display_name = $4,
             email = $5, phone = $6, country = $7, tax_number = $8,
             logo_url = $9, updated_at = now()
         WHERE id = $10
         RETURNING id`,
        [displayName, tenantKey, legalName, displayName, companyEmail || null, phone || null, country || null, taxNumber || null, logoData, tenantEditMatch[1]],
      )

      if (tenantResult.rowCount === 0) {
        await client.query('ROLLBACK')
        sendJson(response, 404, { error: 'Tenant not found' })
        return true
      }

      await client.query(
        `INSERT INTO tenant_addresses (
           tenant_id, address_line_1, address_line_2, city, state, postal_code, country
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id) DO UPDATE SET
           address_line_1 = EXCLUDED.address_line_1,
           address_line_2 = EXCLUDED.address_line_2,
           city = EXCLUDED.city,
           state = EXCLUDED.state,
           postal_code = EXCLUDED.postal_code,
           country = EXCLUDED.country,
           updated_at = now()`,
        [tenantEditMatch[1], address.addressLine1 || null, address.addressLine2 || null, address.city || null, address.state || null, address.postalCode || null, address.country || country || null],
      )

      await client.query('COMMIT')
      sendJson(response, 200, { status: 'ok' })
    } catch (error) {
      await client.query('ROLLBACK')
      if (error.code === '23505') {
        sendJson(response, 409, { error: 'Tenant code already exists' })
        return true
      }
      throw error
    } finally {
      client.release()
    }
    return true
  }

  const tenantStatusMatch = request.url?.match(/^\/auth\/tenants\/(\d+)\/status$/)

  if (request.method === 'PATCH' && tenantStatusMatch) {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const { isActive } = await readJsonBody(request)
    if (typeof isActive !== 'boolean') {
      sendJson(response, 400, { error: 'isActive must be a boolean' })
      return true
    }

    const result = await pool.query(
      `UPDATE tenants
       SET status = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, status`,
      [isActive ? 'active' : 'suspended', tenantStatusMatch[1]],
    )

    if (result.rowCount === 0) {
      sendJson(response, 404, { error: 'Tenant not found' })
      return true
    }

    sendJson(response, 200, { status: 'ok', tenant: result.rows[0] })
    return true
  }

  const tenantPasswordMatch = request.url?.match(/^\/auth\/tenants\/(\d+)\/admin-password$/)

  if (request.method === 'POST' && tenantPasswordMatch) {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const { password } = await readJsonBody(request)
    if (typeof password !== 'string' || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(password)) {
      sendJson(response, 400, { error: 'Password must contain 8 characters, uppercase, lowercase, and a number' })
      return true
    }

    const administratorResult = await pool.query(
      `SELECT u.id
       FROM users AS u
       JOIN roles AS r ON r.id = u.role_id
       WHERE u.tenant_id = $1
         AND r.role_key = 'administrator'
       ORDER BY u.id
       LIMIT 1`,
      [tenantPasswordMatch[1]],
    )

    if (administratorResult.rowCount === 0) {
      sendJson(response, 404, { error: 'Tenant administrator not found' })
      return true
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id })
    await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = now()
       WHERE id = $2`,
      [passwordHash, administratorResult.rows[0].id],
    )
    await pool.query(
      `UPDATE auth_sessions
       SET revoked_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [administratorResult.rows[0].id],
    )

    sendJson(response, 200, { status: 'ok' })
    return true
  }

  const tenantDaysMatch = request.url?.match(/^\/auth\/tenants\/(\d+)\/plan-days$/)

  if (request.method === 'POST' && tenantDaysMatch) {
    const user = await requireSuperadmin(request, response)
    if (!user) return true

    const { days } = await readJsonBody(request)
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      sendJson(response, 400, { error: 'Days must be an integer between 1 and 3650' })
      return true
    }

    const result = await pool.query(
      `UPDATE tenant_subscriptions
       SET ends_at = GREATEST(COALESCE(ends_at, now()), now()) + ($1::int * interval '1 day'),
           status = 'active',
           updated_at = now()
       WHERE tenant_id = $2
         AND status IN ('trialing', 'active')
       RETURNING ends_at`,
      [days, tenantDaysMatch[1]],
    )

    if (result.rowCount === 0) {
      sendJson(response, 404, { error: 'Active tenant subscription not found' })
      return true
    }

    sendJson(response, 200, { status: 'ok', subscriptionEndsAt: result.rows[0].ends_at })
    return true
  }

  return false
}
