import { useEffect, useState } from 'react'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useNotification } from '../components/NotificationProvider.jsx'

const actionKeys = ['view', 'create', 'update', 'delete', 'export']
const fieldSx = { minWidth: 210, '& .MuiOutlinedInput-root': { borderRadius: '4px' } }

function PermissionsPage({ currentUser }) {
  const { notify } = useNotification()
  const isSuperadmin = currentUser?.role === 'superadmin'
  const [tenants, setTenants] = useState([])
  const [roles, setRoles] = useState([])
  const [pages, setPages] = useState([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const contextTenantId = isSuperadmin ? selectedTenantId : currentUser?.tenantId || ''
  const selectedRole = roles.find((role) => String(role.id) === String(selectedRoleId))

  useEffect(() => {
    let ignore = false

    const loadPermissions = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (contextTenantId) params.set('tenantId', contextTenantId)
        if (selectedRoleId) params.set('roleId', selectedRoleId)

        const response = await fetch(`/auth/permissions${params.toString() ? `?${params}` : ''}`, { credentials: 'include' })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || 'Unable to load permissions')
        if (ignore) return

        const nextRoles = payload.roles || []
        setTenants(payload.tenants || [])
        setRoles(nextRoles)
        setPages(payload.pages || [])
        if (selectedRoleId && !nextRoles.some((role) => String(role.id) === String(selectedRoleId))) {
          setSelectedRoleId('')
        }
      } catch (error) {
        if (!ignore) notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to load permissions.' })
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadPermissions()
    return () => { ignore = true }
  }, [contextTenantId, notify, selectedRoleId])

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) setSelectedRoleId(String(roles[0].id))
  }, [roles, selectedRoleId])

  const togglePermission = (pageId, actionKey) => {
    if (!selectedRole?.canManage) return
    setPages((current) => current.map((page) => page.id === pageId
      ? {
        ...page,
        actions: page.actions.map((action) => action.key === actionKey
          ? { ...action, granted: !action.granted }
          : action),
      }
      : page))
  }

  const savePermissions = async () => {
    if (!selectedRole?.canManage) return
    setIsSaving(true)
    try {
      const response = await fetch(`/auth/permissions/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          permissions: pages.map((page) => ({
            pageId: page.id,
            actions: page.actions.filter((action) => action.granted).map((action) => action.key),
          })),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to save permissions')
      notify({ variant: 'success', title: 'Permissions saved', description: `${selectedRole.roleName} permissions were updated successfully.` })
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to save permissions.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100%' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ alignItems: { md: 'center' }, justifyContent: 'flex-end', mb: 1.5 }}>
        {isSuperadmin && (
          <FormControl size="small" sx={fieldSx}>
            <InputLabel id="permissions-tenant-label">Tenant</InputLabel>
            <Select
              labelId="permissions-tenant-label"
              label="Tenant"
              value={selectedTenantId}
              onChange={(event) => {
                setSelectedTenantId(event.target.value)
                setSelectedRoleId('')
                setPages([])
              }}
            >
              <MenuItem value="">Select tenant</MenuItem>
              {tenants.map((tenant) => <MenuItem key={tenant.id} value={String(tenant.id)}>{tenant.displayName}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <FormControl size="small" sx={fieldSx} disabled={!contextTenantId || isLoading}>
          <InputLabel id="permissions-role-label">Active role</InputLabel>
          <Select
            labelId="permissions-role-label"
            label="Active role"
            value={selectedRoleId}
            onChange={(event) => setSelectedRoleId(event.target.value)}
          >
            <MenuItem value="">Select role</MenuItem>
            {roles.map((role) => (
              <MenuItem key={role.id} value={String(role.id)}>
                {role.roleName}{role.isDefault ? ' (Default)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={savePermissions}
          disabled={!selectedRole?.canManage || isSaving || isLoading}
          sx={{ minHeight: 40, textTransform: 'none', boxShadow: 'none', borderRadius: '4px' }}
        >
          {isSaving ? 'Saving...' : 'Save Permissions'}
        </Button>
      </Stack>

      {selectedRole && !selectedRole.canManage && (
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: '4px' }}>
          Administrator account permissions cannot be edited. Select a created role to manage its permissions.
        </Alert>
      )}

      <TableContainer component={Paper} square elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 0, overflowX: 'auto' }}>
        <Table aria-label="Permissions matrix" size="small" sx={{ minWidth: 720, '& .MuiTableCell-root': { py: 0.15 }, '& .MuiCheckbox-root': { p: 0.25 } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ width: 54, fontWeight: 700 }}>#</TableCell>
              <TableCell sx={{ minWidth: 260, fontWeight: 700 }}>Page</TableCell>
              {actionKeys.map((actionKey) => <TableCell key={actionKey} align="center" sx={{ minWidth: 86, fontWeight: 700, textTransform: 'capitalize' }}>{actionKey}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} sx={{ py: 5, textAlign: 'center' }}><CircularProgress size={24} /></TableCell></TableRow>}
            {!isLoading && isSuperadmin && !contextTenantId && <TableRow><TableCell colSpan={7} sx={{ py: 5, color: '#718096', textAlign: 'center' }}>Select a tenant to manage its role permissions.</TableCell></TableRow>}
            {!isLoading && contextTenantId && !selectedRole && <TableRow><TableCell colSpan={7} sx={{ py: 5, color: '#718096', textAlign: 'center' }}>Select an active role to view permissions.</TableCell></TableRow>}
            {!isLoading && selectedRole && pages.map((page, index) => (
              <TableRow key={page.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{page.displayName}</Typography>
                </TableCell>
                {actionKeys.map((actionKey) => {
                  const action = page.actions.find((item) => item.key === actionKey)
                  return (
                    <TableCell key={actionKey} align="center">
                      {action ? (
                        <Checkbox
                          size="small"
                          checked={Boolean(action.granted)}
                          onChange={() => togglePermission(page.id, actionKey)}
                          disabled={!selectedRole.canManage || isSaving}
                          inputProps={{ 'aria-label': `${actionKey} ${page.displayName}` }}
                        />
                      ) : <Box sx={{ height: 32 }} />}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default PermissionsPage
