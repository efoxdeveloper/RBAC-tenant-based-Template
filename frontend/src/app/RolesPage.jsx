import { useEffect, useState } from 'react'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import { useNotification } from '../components/NotificationProvider.jsx'

const initialForm = { roleName: '', roleKey: '', scope: 'tenant', tenantId: '' }
const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '4px' } }

const roleKeyFromName = (value) => value
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60)

function RolesPage({ currentUser }) {
  const { notify } = useNotification()
  const isSuperadmin = currentUser?.role === 'superadmin'
  const [roles, setRoles] = useState([])
  const [tenants, setTenants] = useState([])
  const [form, setForm] = useState(initialForm)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingRoleId, setUpdatingRoleId] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const [autoRoleKey, setAutoRoleKey] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const rolesResponse = await fetch('/auth/roles', { credentials: 'include' })
        const rolesPayload = await rolesResponse.json().catch(() => ({}))
        if (!rolesResponse.ok) throw new Error(rolesPayload.error || 'Unable to load roles')
        setRoles(rolesPayload.roles || [])

        if (isSuperadmin) {
          const tenantsResponse = await fetch('/auth/tenants', { credentials: 'include' })
          const tenantsPayload = await tenantsResponse.json().catch(() => ({}))
          if (!tenantsResponse.ok) throw new Error(tenantsPayload.error || 'Unable to load tenants')
          setTenants(tenantsPayload.tenants || [])
        } else {
          setTenants([])
        }
      } catch (error) {
        notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to load roles.' })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [isSuperadmin, notify])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: field === 'scope' && value === 'platform' ? 'platform' : value, ...(field === 'scope' && value === 'platform' ? { tenantId: '' } : {}) }))
    if (field === 'roleKey') setAutoRoleKey(false)
  }

  const handleRoleNameChange = (event) => {
    const roleName = event.target.value
    setForm((current) => ({
      ...current,
      roleName,
      ...(autoRoleKey ? { roleKey: roleKeyFromName(roleName) } : {}),
    }))
  }

  const closeDialog = () => {
    if (isSaving) return
    setDialogOpen(false)
    setEditingRole(null)
    setForm({ ...initialForm })
    setAutoRoleKey(true)
  }

  const openAddDialog = () => {
    setEditingRole(null)
    setForm({ ...initialForm })
    setAutoRoleKey(true)
    setDialogOpen(true)
  }

  const openEditDialog = (role) => {
    setEditingRole(role)
    setAutoRoleKey(false)
    setForm({
      roleName: role.roleName,
      roleKey: role.roleKey,
      scope: role.scope,
      tenantId: role.tenantId ?? '',
    })
    setDialogOpen(true)
  }

  const createRole = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetch(editingRole ? `/auth/roles/${editingRole.id}` : '/auth/roles', {
        method: editingRole ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, tenantId: form.tenantId === '' ? null : Number(form.tenantId) }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to create role')
      setRoles((current) => {
        const nextRoles = editingRole
          ? current.map((role) => role.id === payload.role.id
            ? {
              ...role,
              ...payload.role,
              tenantName: payload.role.tenantName || (payload.role.isDefault ? 'Default' : 'All tenants'),
            }
            : role)
          : [...current, {
            ...payload.role,
            tenantName: payload.role.tenantName || (payload.role.isDefault ? 'Default' : 'All tenants'),
          }]

        return nextRoles.sort((a, b) => a.roleName.localeCompare(b.roleName))
      })
      closeDialog()
      notify({ variant: 'success', title: editingRole ? 'Role updated' : 'Role created', description: `${payload.role.roleName} was ${editingRole ? 'updated' : 'added'} successfully.` })
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to create role.' })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleRoleStatus = async (role) => {
    setUpdatingRoleId(role.id)
    try {
      const response = await fetch(`/auth/roles/${role.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !role.isActive }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to update role')
      setRoles((current) => current.map((item) => item.id === role.id ? { ...item, isActive: payload.role.isActive } : item))
      notify({ variant: 'success', title: 'Role updated', description: `${role.roleName} is now ${!role.isActive ? 'active' : 'inactive'}.` })
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to update role.' })
    } finally {
      setUpdatingRoleId(null)
    }
  }

  return (
    <Box sx={{ minHeight: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <Button variant="contained" startIcon={<PlaylistAddRoundedIcon />} onClick={openAddDialog} sx={{ textTransform: 'none', boxShadow: 'none', borderRadius: '4px' }}>
          Add Role
        </Button>
      </Box>

      <TableContainer component={Paper} square elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 0 }}>
        <Table aria-label="Roles table" size="small" sx={{ '& .MuiTableCell-root': { py: 0.35 }, '& .MuiIconButton-root': { p: 0.25 } }}>
          <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}>
            <TableCell sx={{ width: 70, fontWeight: 700 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Role name</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Role key</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Scope</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tenant name</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} sx={{ py: 5, textAlign: 'center' }}>Loading roles...</TableCell></TableRow>}
            {!isLoading && roles.length === 0 && <TableRow><TableCell colSpan={7} sx={{ py: 5, color: '#718096', textAlign: 'center' }}>No roles found.</TableCell></TableRow>}
            {!isLoading && roles.map((role, index) => (
              <TableRow key={role.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{role.roleName}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{role.roleKey}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{role.scope}</TableCell>
                <TableCell>{role.tenantName || (role.isDefault ? 'Default' : 'All tenants')}</TableCell>
                <TableCell>{role.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.25}>
                    <IconButton size="small" title={role.canManage ? 'Edit role' : 'Default roles are read-only'} aria-label={`Edit ${role.roleName}`} onClick={() => openEditDialog(role)} disabled={!role.canManage}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title={!role.canManage ? 'Default roles are read-only' : role.isActive ? 'Disable' : 'Enable'} onClick={() => toggleRoleStatus(role)} disabled={!role.canManage || updatingRoleId === role.id}>
                      <Switch size="small" checked={role.isActive} color="success" inputProps={{ 'aria-label': `${role.isActive ? 'Disable' : 'Enable'} ${role.roleName}` }} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: '4px' } } }}>
        <Box component="form" onSubmit={createRole}>
          <DialogTitle>{editingRole ? 'Edit Role' : 'Add Role'}</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <TextField label="Role name" placeholder="Support Agent" value={form.roleName} onChange={handleRoleNameChange} required size="small" sx={fieldSx} />
              <TextField label="Role key" placeholder="support-agent" value={form.roleKey} onChange={handleChange('roleKey')} helperText={editingRole ? 'Role key cannot be changed.' : 'Use lowercase letters, numbers, and hyphens.'} disabled={Boolean(editingRole)} required size="small" sx={fieldSx} />
              {isSuperadmin && (
                <>
                  <FormControl fullWidth required size="small" sx={fieldSx}>
                    <InputLabel id="role-scope-label">Scope</InputLabel>
                    <Select labelId="role-scope-label" label="Scope" value={form.scope} onChange={handleChange('scope')}>
                      <MenuItem value="tenant">Tenant</MenuItem>
                      <MenuItem value="platform">Platform</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" sx={fieldSx} disabled={form.scope === 'platform'}>
                    <InputLabel id="role-tenant-label">Tenant</InputLabel>
                    <Select labelId="role-tenant-label" label="Tenant" value={form.tenantId} onChange={handleChange('tenantId')}>
                      <MenuItem value="">All tenants</MenuItem>
                      {tenants.map((tenant) => <MenuItem key={tenant.id} value={tenant.id}>{tenant.displayName} (ID: {tenant.id})</MenuItem>)}
                    </Select>
                  </FormControl>
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog} disabled={isSaving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSaving} sx={{ borderRadius: '4px' }}>{isSaving ? 'Saving...' : editingRole ? 'Save Changes' : 'Add Role'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default RolesPage
