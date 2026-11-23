import { useEffect, useState } from 'react'
import DomainRoundedIcon from '@mui/icons-material/DomainRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded'
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import InputAdornment from '@mui/material/InputAdornment'
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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useNotification } from '../components/NotificationProvider.jsx'

const initialForm = {
  legalName: '', displayName: '', tenantKey: '', email: '', phone: '', country: '', taxNumber: '',
  addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '',
  administratorName: '', administratorEmail: '', administratorPassword: '', planId: '', logoData: '', logoFileName: '',
}

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '4px' } }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const tenantKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const isValidPhone = (value) => {
  if (!value) return true
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15 && /^[+\d()\s-]+$/.test(value)
}

const formatExpiryDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  : '—'

const daysUntilExpiry = (value) => value
  ? Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : null

function FormSection({ title, children }) {
  return (
    <Box>
      <Typography sx={{ pb: 0.75, mb: 1.25, borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, color: '#263238' }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

const tenantCodeFromName = (value) => value
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60)

function TenantsPage() {
  const { notify } = useNotification()
  const [tenants, setTenants] = useState([])
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState(initialForm)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [autoFields, setAutoFields] = useState({ displayName: true, tenantKey: true })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [editingTenant, setEditingTenant] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [actionDialog, setActionDialog] = useState(null)
  const [actionValue, setActionValue] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [isActionSaving, setIsActionSaving] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tenantsResponse, plansResponse] = await Promise.all([
          fetch('/auth/tenants', { credentials: 'include' }),
          fetch('/auth/plans', { credentials: 'include' }),
        ])
        const tenantsPayload = await tenantsResponse.json().catch(() => ({}))
        const plansPayload = await plansResponse.json().catch(() => ({}))
        if (!tenantsResponse.ok) throw new Error(tenantsPayload.error || 'Unable to load tenants')
        if (!plansResponse.ok) throw new Error(plansPayload.error || 'Unable to load plans')
        setTenants(tenantsPayload.tenants || [])
        setPlans((plansPayload.plans || []).filter((plan) => plan.isActive))
      } catch (error) {
        notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to load tenant data.' })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [notify])

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))

    if (field === 'displayName' || field === 'tenantKey') {
      setAutoFields((current) => ({ ...current, [field]: false }))
    }
  }

  const handleLogoUpload = (event, setter) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      notify({ variant: 'error', title: 'Invalid logo', description: 'Upload a PNG, JPEG, or WebP image.' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      notify({ variant: 'error', title: 'Logo is too large', description: 'Logo image must be 2 MB or smaller.' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => setter((current) => ({ ...current, logoData: String(reader.result), logoFileName: file.name }))
    reader.readAsDataURL(file)
  }

  const handleLegalNameChange = (event) => {
    const legalName = event.target.value
    const displayName = legalName.trim()
    const tenantKey = tenantCodeFromName(legalName)

    setForm((current) => ({
      ...current,
      legalName,
      ...(autoFields.displayName ? { displayName } : {}),
      ...(autoFields.tenantKey ? { tenantKey } : {}),
    }))
    setErrors((current) => ({ ...current, legalName: '', displayName: '', tenantKey: '' }))
  }

  const resetForm = () => {
    setForm({ ...initialForm })
    setAutoFields({ displayName: true, tenantKey: true })
    setErrors({})
  }

  const validateForm = () => {
    const nextErrors = {}

    if (form.legalName.trim().length < 2) nextErrors.legalName = 'Legal company name is required'
    if (form.displayName.trim().length < 2) nextErrors.displayName = 'Display name is required'
    if (!tenantKeyPattern.test(form.tenantKey.trim())) nextErrors.tenantKey = 'Enter a valid tenant code'
    if (form.email && !emailPattern.test(form.email.trim())) nextErrors.email = 'Enter a valid company email'
    if (!isValidPhone(form.phone.trim())) nextErrors.phone = 'Enter a valid phone number'
    if (form.administratorName.trim().length < 2) nextErrors.administratorName = 'Administrator name is required'
    if (!emailPattern.test(form.administratorEmail.trim())) nextErrors.administratorEmail = 'Enter a valid administrator email'
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(form.administratorPassword)) {
      nextErrors.administratorPassword = 'Use 8+ characters with uppercase, lowercase, and a number'
    }
    if (!form.planId) nextErrors.planId = 'Select a plan'

    return nextErrors
  }

  const closeDialog = () => {
    if (isSaving) return
    setDialogOpen(false)
    resetForm()
    setShowPassword(false)
  }

  const createTenant = async (event) => {
    event.preventDefault()

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      notify({ variant: 'error', title: 'Check the form', description: 'Please correct the highlighted fields.' })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/auth/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          planId: Number(form.planId),
          address: {
            addressLine1: form.addressLine1, addressLine2: form.addressLine2, city: form.city,
            state: form.state, postalCode: form.postalCode, country: form.country,
          },
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to onboard tenant')
      setTenants((current) => [payload.tenant, ...current])
      setDialogOpen(false)
      resetForm()
      setShowPassword(false)
      notify({ variant: 'success', title: 'Tenant onboarded', description: `${payload.tenant.displayName} was created successfully.` })
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to onboard tenant.' })
    } finally {
      setIsSaving(false)
    }
  }

  const openEditTenant = (tenant) => {
    setEditingTenant(tenant)
    setEditForm({
      legalName: tenant.legalName || '',
      displayName: tenant.displayName || '',
      tenantKey: tenant.tenantKey || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      country: tenant.country || '',
      taxNumber: tenant.taxNumber || '',
      addressLine1: tenant.addressLine1 || '',
      addressLine2: tenant.addressLine2 || '',
      city: tenant.city || '',
      state: tenant.state || '',
      postalCode: tenant.postalCode || '',
      addressCountry: tenant.addressCountry || tenant.country || '',
      logoData: tenant.logoUrl || '',
      logoFileName: '',
    })
  }

  const closeEditTenant = () => {
    setEditingTenant(null)
    setEditForm(null)
  }

  const handleEditChange = (field) => (event) => {
    setEditForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const updateTenant = async (event) => {
    event.preventDefault()
    setIsActionSaving(true)

    try {
      const response = await fetch(`/auth/tenants/${editingTenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...editForm,
          address: {
            addressLine1: editForm.addressLine1,
            addressLine2: editForm.addressLine2,
            city: editForm.city,
            state: editForm.state,
            postalCode: editForm.postalCode,
            country: editForm.addressCountry,
          },
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to update tenant')

      setTenants((current) => current.map((tenant) => tenant.id === editingTenant.id
        ? { ...tenant, ...editForm, logoUrl: editForm.logoData || null, addressCountry: editForm.addressCountry }
        : tenant))
      closeEditTenant()
      notify({ variant: 'success', title: 'Tenant updated', description: 'Tenant details were updated successfully.' })
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to update tenant.' })
    } finally {
      setIsActionSaving(false)
    }
  }

  const toggleTenantStatus = async (tenant) => {
    const isActive = tenant.status !== 'active'
    setIsActionSaving(true)

    try {
      const response = await fetch(`/auth/tenants/${tenant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to update tenant status')
      setTenants((current) => current.map((item) => item.id === tenant.id ? { ...item, status: payload.tenant.status } : item))
      notify({ variant: 'success', title: 'Tenant updated', description: `${tenant.displayName} is now ${isActive ? 'active' : 'suspended'}.` })
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to update tenant status.' })
    } finally {
      setIsActionSaving(false)
    }
  }

  const openActionDialog = (type, tenant) => {
    setActionDialog({ type, tenant })
    setActionValue('')
    setShowResetPassword(false)
  }

  const closeActionDialog = () => {
    setActionDialog(null)
    setActionValue('')
    setShowResetPassword(false)
  }

  const submitAction = async (event) => {
    event.preventDefault()
    if (!actionDialog) return

    const isPasswordReset = actionDialog.type === 'password'
    const isAddDays = actionDialog.type === 'days'
    const isStatusChange = actionDialog.type === 'status'
    const passwordIsValid = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(actionValue)
    const days = Number(actionValue)

    if (isPasswordReset && !passwordIsValid) {
      notify({ variant: 'error', title: 'Invalid password', description: 'Use 8+ characters with uppercase, lowercase, and a number.' })
      return
    }
    if (isAddDays && (!Number.isInteger(days) || days < 1 || days > 3650)) {
      notify({ variant: 'error', title: 'Invalid days', description: 'Enter a number between 1 and 3650.' })
      return
    }

    setIsActionSaving(true)
    try {
      const endpoint = isPasswordReset
        ? `/auth/tenants/${actionDialog.tenant.id}/admin-password`
        : isAddDays
          ? `/auth/tenants/${actionDialog.tenant.id}/plan-days`
          : `/auth/tenants/${actionDialog.tenant.id}/status`
      const method = isStatusChange ? 'PATCH' : 'POST'
      const body = isPasswordReset
        ? { password: actionValue }
        : isAddDays
          ? { days }
          : { isActive: actionDialog.tenant.status !== 'active' }
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to complete action')

      if (isAddDays) {
        setTenants((current) => current.map((tenant) => tenant.id === actionDialog.tenant.id
          ? { ...tenant, subscriptionEndsAt: payload.subscriptionEndsAt }
          : tenant))
      }
      if (isStatusChange) {
        setTenants((current) => current.map((tenant) => tenant.id === actionDialog.tenant.id
          ? { ...tenant, status: payload.tenant.status }
          : tenant))
      }
      closeActionDialog()
      notify({
        variant: 'success',
        title: isPasswordReset ? 'Password reset' : isAddDays ? 'Plan extended' : 'Tenant status updated',
        description: isPasswordReset
          ? 'The administrator password was reset.'
          : isAddDays
            ? `${days} days were added to the tenant plan.`
            : `The tenant was ${actionDialog.tenant.status === 'active' ? 'suspended' : 'enabled'}.`,
      })
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to complete action.' })
    } finally {
      setIsActionSaving(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <Button variant="contained" startIcon={<PersonAddRoundedIcon />} onClick={() => setDialogOpen(true)} sx={{ textTransform: 'none', boxShadow: 'none', borderRadius: '4px' }}>
          Onboard New
        </Button>
      </Box>

      <TableContainer component={Paper} square elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 0 }}>
        <Table aria-label="Tenants table" size="small" sx={{ '& .MuiTableCell-root': { py: 0.35 }, '& .MuiIconButton-root': { p: 0.25 } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ width: 70, fontWeight: 700 }}>#</TableCell>
              <TableCell sx={{ width: 70, fontWeight: 700 }}>Icon</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tenant name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Administrator</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Plan expiry</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} sx={{ py: 5, textAlign: 'center' }}>Loading tenants...</TableCell></TableRow>}
            {!isLoading && tenants.length === 0 && <TableRow><TableCell colSpan={9} sx={{ py: 5, color: '#718096', textAlign: 'center' }}>No tenants onboarded yet.</TableCell></TableRow>}
            {!isLoading && tenants.map((tenant, index) => {
              const remainingDays = daysUntilExpiry(tenant.subscriptionEndsAt)
              const isExpiringSoon = remainingDays !== null
                && remainingDays >= 0
                && remainingDays <= tenant.warningBeforeExpiryDays

              return (
              <TableRow key={tenant.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {tenant.logoUrl
                    ? <Box component="img" src={tenant.logoUrl} alt="" sx={{ width: 28, height: 28, objectFit: 'contain', display: 'block' }} />
                    : <DomainRoundedIcon fontSize="small" sx={{ color: '#53635e' }} />}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{tenant.displayName}</TableCell>
                <TableCell>{tenant.administratorName || '—'}</TableCell>
                <TableCell>{tenant.administratorEmail || tenant.email || '—'}</TableCell>
                <TableCell>{tenant.planName || '—'}</TableCell>
                <TableCell sx={{ color: isExpiringSoon ? '#b45309' : 'inherit', fontWeight: isExpiringSoon ? 600 : 400 }}>
                  {formatExpiryDate(tenant.subscriptionEndsAt)}
                  {isExpiringSoon && <Box component="span" sx={{ display: 'block', fontSize: 11 }}>Expires in {remainingDays} days</Box>}
                </TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{tenant.status}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.25}>
                    <IconButton size="small" title="Edit tenant" aria-label={`Edit ${tenant.displayName}`} onClick={() => openEditTenant(tenant)} disabled={isActionSaving}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title="Reset administrator password" aria-label={`Reset administrator password for ${tenant.displayName}`} onClick={() => openActionDialog('password', tenant)} disabled={isActionSaving}>
                      <LockResetRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title="Add plan days" aria-label={`Add plan days for ${tenant.displayName}`} onClick={() => openActionDialog('days', tenant)} disabled={isActionSaving}>
                      <EventAvailableRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title={tenant.status === 'active' ? 'Disable tenant' : 'Enable tenant'} aria-label={tenant.status === 'active' ? `Disable ${tenant.displayName}` : `Enable ${tenant.displayName}`} onClick={() => openActionDialog('status', tenant)} disabled={isActionSaving} color={tenant.status === 'active' ? 'error' : 'success'}>
                      <PowerSettingsNewRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        anchor="right"
        open={dialogOpen}
        onClose={closeDialog}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 720 },
              maxWidth: '100%',
              borderRadius: 0,
            },
          },
        }}
      >
        <Box component="form" onSubmit={createTenant} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e2e8f0' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Onboard New Tenant</Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
            <Stack spacing={3}>
              <FormSection title="Company details">
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField label="Legal company name" value={form.legalName} onChange={handleLegalNameChange} error={Boolean(errors.legalName)} helperText={errors.legalName} required fullWidth size="small" sx={fieldSx} />
                    <TextField label="Display name" value={form.displayName} onChange={handleChange('displayName')} error={Boolean(errors.displayName)} helperText={errors.displayName} required fullWidth size="small" sx={fieldSx} />
                    <TextField label="Tenant code" placeholder="acme" value={form.tenantKey} onChange={handleChange('tenantKey')} error={Boolean(errors.tenantKey)} helperText={errors.tenantKey} required fullWidth size="small" sx={fieldSx} />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField label="Company email" type="email" value={form.email} onChange={handleChange('email')} error={Boolean(errors.email)} helperText={errors.email} fullWidth size="small" sx={fieldSx} />
                    <TextField label="Phone" value={form.phone} onChange={handleChange('phone')} error={Boolean(errors.phone)} helperText={errors.phone} fullWidth size="small" sx={fieldSx} />
                    <TextField label="Tax number" value={form.taxNumber} onChange={handleChange('taxNumber')} fullWidth size="small" sx={fieldSx} />
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button component="label" variant="outlined" size="small" startIcon={<ImageRoundedIcon />} sx={{ borderRadius: '4px', textTransform: 'none' }}>
                      Upload logo
                      <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleLogoUpload(event, setForm)} />
                    </Button>
                    {form.logoData && <Box component="img" src={form.logoData} alt="Company logo preview" sx={{ width: 36, height: 36, objectFit: 'contain' }} />}
                    {form.logoFileName && <Typography sx={{ fontSize: 12, color: '#718096' }}>{form.logoFileName}</Typography>}
                  </Stack>
                </Stack>
              </FormSection>

              <FormSection title="Address">
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField label="Address line 1" value={form.addressLine1} onChange={handleChange('addressLine1')} fullWidth size="small" sx={fieldSx} />
                    <TextField label="Address line 2" value={form.addressLine2} onChange={handleChange('addressLine2')} fullWidth size="small" sx={fieldSx} />
                    <TextField label="Country" value={form.country} onChange={handleChange('country')} fullWidth size="small" sx={fieldSx} />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField label="City" value={form.city} onChange={handleChange('city')} fullWidth size="small" sx={fieldSx} />
                    <TextField label="State" value={form.state} onChange={handleChange('state')} fullWidth size="small" sx={fieldSx} />
                    <TextField label="Postal code" value={form.postalCode} onChange={handleChange('postalCode')} fullWidth size="small" sx={fieldSx} />
                  </Stack>
                </Stack>
              </FormSection>

              <FormSection title="Administrator account">
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField label="Administrator name" value={form.administratorName} onChange={handleChange('administratorName')} error={Boolean(errors.administratorName)} helperText={errors.administratorName} required fullWidth size="small" sx={fieldSx} />
                    <TextField label="Administrator email" type="email" value={form.administratorEmail} onChange={handleChange('administratorEmail')} error={Boolean(errors.administratorEmail)} helperText={errors.administratorEmail} required fullWidth size="small" sx={fieldSx} />
                  </Stack>
                  <TextField
                    label="Administrator password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.administratorPassword}
                    onChange={handleChange('administratorPassword')}
                    helperText={errors.administratorPassword || '8+ characters, uppercase, lowercase, and number'}
                    error={Boolean(errors.administratorPassword)}
                    required
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              edge="end"
                              size="small"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowPassword((current) => !current)}
                              sx={{ color: '#53635e', visibility: 'visible' }}
                            >
                              {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Stack>
              </FormSection>

              <FormSection title="Plan">
                <FormControl fullWidth required size="small" error={Boolean(errors.planId)} sx={fieldSx}>
                  <InputLabel id="tenant-plan-label">Plan</InputLabel>
                  <Select labelId="tenant-plan-label" label="Plan" value={form.planId} onChange={handleChange('planId')}>
                    {plans.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.planName}</MenuItem>)}
                  </Select>
                  {errors.planId && <Typography sx={{ mt: 0.5, ml: 1.5, fontSize: 12, color: '#d32f2f' }}>{errors.planId}</Typography>}
                </FormControl>
              </FormSection>
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 2.5, py: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#fff' }}>
            <Button onClick={closeDialog} disabled={isSaving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSaving} sx={{ borderRadius: '4px' }}>{isSaving ? 'Saving...' : 'Onboard Tenant'}</Button>
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={Boolean(editingTenant)}
        onClose={closeEditTenant}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 600 }, maxWidth: '100%', borderRadius: 0 } } }}
      >
        {editForm && (
          <Box component="form" onSubmit={updateTenant} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e2e8f0' }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Edit Tenant</Typography>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
              <Stack spacing={2.5}>
                <FormSection title="Company details">
                  <Stack spacing={1.5}>
                    <TextField label="Legal company name" value={editForm.legalName} onChange={handleEditChange('legalName')} required fullWidth size="small" sx={fieldSx} />
                    <TextField label="Display name" value={editForm.displayName} onChange={handleEditChange('displayName')} required fullWidth size="small" sx={fieldSx} />
                    <TextField label="Tenant code" value={editForm.tenantKey} onChange={handleEditChange('tenantKey')} required fullWidth size="small" sx={fieldSx} />
                    <TextField label="Company email" type="email" value={editForm.email} onChange={handleEditChange('email')} fullWidth size="small" sx={fieldSx} />
                    <TextField label="Phone" value={editForm.phone} onChange={handleEditChange('phone')} fullWidth size="small" sx={fieldSx} />
                    <TextField label="Tax number" value={editForm.taxNumber} onChange={handleEditChange('taxNumber')} fullWidth size="small" sx={fieldSx} />
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Button component="label" variant="outlined" size="small" startIcon={<ImageRoundedIcon />} sx={{ borderRadius: '4px', textTransform: 'none' }}>
                        Upload logo
                        <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleLogoUpload(event, setEditForm)} />
                      </Button>
                      {editForm.logoData && <Box component="img" src={editForm.logoData} alt="Company logo preview" sx={{ width: 36, height: 36, objectFit: 'contain' }} />}
                      {editForm.logoFileName && <Typography sx={{ fontSize: 12, color: '#718096' }}>{editForm.logoFileName}</Typography>}
                    </Stack>
                  </Stack>
                </FormSection>
                <FormSection title="Address">
                  <Stack spacing={1.5}>
                    <TextField label="Address line 1" value={editForm.addressLine1} onChange={handleEditChange('addressLine1')} fullWidth size="small" sx={fieldSx} />
                    <TextField label="Address line 2" value={editForm.addressLine2} onChange={handleEditChange('addressLine2')} fullWidth size="small" sx={fieldSx} />
                    <TextField label="Country" value={editForm.addressCountry} onChange={handleEditChange('addressCountry')} fullWidth size="small" sx={fieldSx} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <TextField label="City" value={editForm.city} onChange={handleEditChange('city')} fullWidth size="small" sx={fieldSx} />
                      <TextField label="State" value={editForm.state} onChange={handleEditChange('state')} fullWidth size="small" sx={fieldSx} />
                      <TextField label="Postal code" value={editForm.postalCode} onChange={handleEditChange('postalCode')} fullWidth size="small" sx={fieldSx} />
                    </Stack>
                  </Stack>
                </FormSection>
              </Stack>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 2.5, py: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#fff' }}>
              <Button onClick={closeEditTenant} disabled={isActionSaving}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isActionSaving} sx={{ borderRadius: '4px' }}>{isActionSaving ? 'Saving...' : 'Save Changes'}</Button>
            </Box>
          </Box>
        )}
      </Drawer>

      <Dialog open={Boolean(actionDialog)} onClose={closeActionDialog} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: '4px' } } }}>
        <Box component="form" onSubmit={submitAction}>
          <DialogTitle>
            {actionDialog?.type === 'password'
              ? 'Reset Administrator Password'
              : actionDialog?.type === 'days'
                ? 'Add Plan Days'
                : `${actionDialog?.tenant?.status === 'active' ? 'Disable' : 'Enable'} Tenant`}
          </DialogTitle>
          <DialogContent>
            {actionDialog?.type === 'password' ? (
              <TextField
                autoFocus
                margin="dense"
                label="New password"
                type={showResetPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={actionValue}
                onChange={(event) => setActionValue(event.target.value)}
                helperText="8+ characters, uppercase, lowercase, and number"
                fullWidth
                size="small"
                sx={fieldSx}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="button" edge="end" size="small" onClick={() => setShowResetPassword((current) => !current)} aria-label={showResetPassword ? 'Hide password' : 'Show password'}>
                          {showResetPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            ) : actionDialog?.type === 'days' ? (
              <TextField
                autoFocus
                margin="dense"
                label="Days to add"
                type="number"
                value={actionValue}
                onChange={(event) => setActionValue(event.target.value)}
                helperText="Enter a value from 1 to 3650 days."
                inputProps={{ min: 1, max: 3650, step: 1 }}
                fullWidth
                size="small"
                sx={fieldSx}
              />
            ) : (
              <Typography sx={{ py: 1 }}>
                {actionDialog?.tenant?.status === 'active'
                  ? `Disable ${actionDialog?.tenant?.displayName}? Tenant users will no longer be able to sign in.`
                  : `Enable ${actionDialog?.tenant?.displayName}? Tenant users will be able to sign in again.`}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeActionDialog} disabled={isActionSaving}>Cancel</Button>
            <Button type="submit" variant="contained" color={actionDialog?.type === 'status' && actionDialog?.tenant?.status === 'active' ? 'error' : 'primary'} disabled={isActionSaving} sx={{ borderRadius: '4px' }}>{isActionSaving ? 'Saving...' : 'Confirm'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default TenantsPage
