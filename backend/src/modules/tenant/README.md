# Tenant modules

Tenant-scoped CRM APIs belong in this directory.

Recommended future structure:

- `customers.routes.js`
- `tickets.routes.js`
- `reports.routes.js`
- `settings.routes.js`

These routes should always resolve the tenant from the authenticated user's `tenant_id` and apply it to every database query.
