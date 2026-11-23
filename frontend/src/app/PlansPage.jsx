import { useEffect, useState } from 'react'
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded'
import AddRoundedIcon from '@mui/icons-material/PlaylistAddRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import { useNotification } from '../components/NotificationProvider.jsx'

const initialForm = { planCode: '', planName: '', description: '', durationDays: 30, warningBeforeExpiryDays: 7 }
const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '4px' } }

function PlansPage() {
  const { notify } = useNotification()
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState(initialForm)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingPlanId, setUpdatingPlanId] = useState(null)

  const loadPlans = async () => {
    try {
      const response = await fetch('/auth/plans', { credentials: 'include' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to load plans')
      setPlans(payload.plans || [])
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to load plans.' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadPlans() }, [])

  const handleChange = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const closeDialog = () => {
    if (isSaving) return
    setDialogOpen(false)
    setForm({ ...initialForm })
  }

  const createPlan = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetch('/auth/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          durationDays: Number(form.durationDays),
          warningBeforeExpiryDays: Number(form.warningBeforeExpiryDays),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to create plan')
      setPlans((current) => [...current, payload.plan])
      closeDialog()
      notify({ variant: 'success', title: 'Plan created', description: `${payload.plan.planName} was added successfully.` })
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to create plan.' })
    } finally {
      setIsSaving(false)
    }
  }

  const togglePlanStatus = async (plan) => {
    setUpdatingPlanId(plan.id)
    try {
      const response = await fetch(`/auth/plans/${plan.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !plan.isActive }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to update plan')
      setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, isActive: payload.plan.is_active } : item))
      notify({ variant: 'success', title: 'Plan updated', description: `${plan.planName} is now ${!plan.isActive ? 'active' : 'inactive'}.` })
    } catch (error) {
      notify({ variant: 'error', title: 'Error', description: error.message || 'Unable to update plan.' })
    } finally {
      setUpdatingPlanId(null)
    }
  }

  return (
    <Box sx={{ minHeight: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialogOpen(true)} sx={{ textTransform: 'none', boxShadow: 'none', borderRadius: '4px' }}>
          Add Plan
        </Button>
      </Box>
      <TableContainer component={Paper} square elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 0 }}>
        <Table aria-label="Plans table" size="small" sx={{ '& .MuiTableCell-root': { py: 0.35 }, '& .MuiIconButton-root': { p: 0.25 } }}>
          <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}>
            <TableCell sx={{ width: 70, fontWeight: 700 }}>#</TableCell>
            <TableCell sx={{ width: 70, fontWeight: 700 }}>Icon</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Plan name</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Warning before expiry</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8} sx={{ py: 5, textAlign: 'center' }}>Loading plans...</TableCell></TableRow>}
            {!isLoading && plans.length === 0 && <TableRow><TableCell colSpan={8} sx={{ py: 5, color: '#718096', textAlign: 'center' }}>No plans found.</TableCell></TableRow>}
            {!isLoading && plans.map((plan, index) => (
              <TableRow key={plan.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell><MonetizationOnRoundedIcon fontSize="small" sx={{ color: '#53635e' }} /></TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{plan.planName}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{plan.planCode}</TableCell>
                <TableCell>{plan.durationDays} days</TableCell>
                <TableCell>{plan.warningBeforeExpiryDays} days before</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{plan.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <IconButton size="small" title={plan.isActive ? 'Disable' : 'Enable'} onClick={() => togglePlanStatus(plan)} disabled={updatingPlanId === plan.id}>
                    <Switch size="small" checked={plan.isActive} color="success" inputProps={{ 'aria-label': `${plan.isActive ? 'Disable' : 'Enable'} ${plan.planName}` }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: '4px' } } }}>
        <Box component="form" onSubmit={createPlan}>
          <DialogTitle>Add Plan</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <TextField label="Plan code" placeholder="starter" value={form.planCode} onChange={handleChange('planCode')} required size="small" sx={fieldSx} />
              <TextField label="Plan name" placeholder="Starter" value={form.planName} onChange={handleChange('planName')} required size="small" sx={fieldSx} />
              <TextField label="Description" value={form.description} onChange={handleChange('description')} multiline minRows={2} size="small" sx={fieldSx} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField label="Plan duration (days)" type="number" value={form.durationDays} onChange={handleChange('durationDays')} inputProps={{ min: 1, step: 1 }} required size="small" fullWidth sx={fieldSx} />
                <TextField label="Warning before expiry (days)" type="number" value={form.warningBeforeExpiryDays} onChange={handleChange('warningBeforeExpiryDays')} inputProps={{ min: 0, step: 1 }} required size="small" fullWidth sx={fieldSx} />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={closeDialog} disabled={isSaving}>Cancel</Button><Button type="submit" variant="contained" disabled={isSaving} sx={{ borderRadius: '4px' }}>{isSaving ? 'Saving...' : 'Add Plan'}</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default PlansPage
