import { handleAuthRoutes } from './auth.routes.js'
import { handlePageRoutes } from './pages.routes.js'
import { handlePlanRoutes } from './plans.routes.js'
import { handlePermissionRoutes } from './permissions.routes.js'
import { handleRoleRoutes } from './roles.routes.js'
import { handleTenantRoutes } from './tenants.routes.js'

export const handlePlatformRoutes = async (request, response) => {
  if (await handleAuthRoutes(request, response)) return true
  if (await handlePlanRoutes(request, response)) return true
  if (await handlePermissionRoutes(request, response)) return true
  if (await handleRoleRoutes(request, response)) return true
  if (await handleTenantRoutes(request, response)) return true
  if (await handlePageRoutes(request, response)) return true

  return false
}
