import { useEffect, useState } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import InputLabel from '@mui/material/InputLabel'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { useNotification } from '../components/NotificationProvider.jsx'
import { pageIconOptions, pageIconsByKey } from '../components/icons/pageIconOptions.jsx'

const initialForm = {
  pageKey: '',
  displayName: '',
  pageType: 'tenant',
  route: '/app/',
  iconKey: 'dashboard',
  sortOrder: 100,
  actions: ['view'],
}

const compactFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '4px',
  },
}

function PageMasterPage() {
  const [pages, setPages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingPageId, setUpdatingPageId] = useState(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingPage, setEditingPage] = useState(null)
  const [form, setForm] = useState(initialForm)
  const { notify } = useNotification()
  const isMobile = useMediaQuery('(max-width:599.95px)')

  useEffect(() => {
    const loadPages = async () => {
      try {
        const response = await fetch('/auth/pages', { credentials: 'include' })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load pages')
        }

        setPages(payload.pages || [])
      } catch (error) {
        notify({
          variant: 'error',
          title: 'Error',
          description: error.message || 'We could not load the pages.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPages()
  }, [notify])

  const togglePageStatus = async (page) => {
    setUpdatingPageId(page.id)

    try {
      const response = await fetch(`/auth/pages/${page.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !page.isActive }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update page status')
      }

      setPages((currentPages) => currentPages.map((currentPage) => (
        currentPage.id === page.id
          ? { ...currentPage, isActive: payload.page.is_active }
          : currentPage
      )))
      window.dispatchEvent(new Event('navigation-updated'))
      notify({
        variant: 'success',
        title: 'Page updated',
        description: `${page.displayName} is now ${!page.isActive ? 'active' : 'inactive'}.`,
      })
    } catch (error) {
      notify({
        variant: 'error',
        title: 'Error',
        description: error.message || 'We could not update the page status.',
      })
    } finally {
      setUpdatingPageId(null)
    }
  }

  const handleFormChange = (field) => (event) => {
    setForm((currentForm) => ({ ...currentForm, [field]: event.target.value }))
  }

  const toggleAction = (actionKey) => () => {
    setForm((currentForm) => ({
      ...currentForm,
      actions: currentForm.actions.includes(actionKey)
        ? currentForm.actions.filter((key) => key !== actionKey)
        : [...currentForm.actions, actionKey],
    }))
  }

  const resetAddForm = () => {
    setForm({ ...initialForm })
  }

  const openAddDialog = () => {
    setEditingPage(null)
    resetAddForm()
    setAddDialogOpen(true)
  }

  const closeAddDialog = () => {
    if (isSaving) return
    setAddDialogOpen(false)
    setEditingPage(null)
    resetAddForm()
  }

  const openEditDialog = (page) => {
    setEditingPage(page)
    setForm({
      pageKey: page.pageKey,
      displayName: page.displayName,
      pageType: page.pageType,
      route: page.route,
      iconKey: page.iconKey || 'dashboard',
      sortOrder: page.sortOrder,
      actions: page.actions || [],
    })
    setAddDialogOpen(true)
  }

  const createPage = async (event) => {
    event.preventDefault()

    if (!editingPage && form.actions.length === 0) {
      notify({
        variant: 'error',
        title: 'Action permission required',
        description: 'Select at least one action permission for this page.',
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(editingPage ? `/auth/pages/${editingPage.id}` : '/auth/pages', {
        method: editingPage ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to create page')
      }

      setPages((currentPages) => {
        const nextPages = editingPage
          ? currentPages.map((page) => page.id === payload.page.id ? payload.page : page)
          : [...currentPages, payload.page]

        return nextPages.sort((a, b) => a.sortOrder - b.sortOrder)
      })
      setAddDialogOpen(false)
      setEditingPage(null)
      resetAddForm()
      window.dispatchEvent(new Event('navigation-updated'))
      notify({
        variant: 'success',
        title: editingPage ? 'Page updated' : 'Page created',
        description: `${payload.page.displayName} was ${editingPage ? 'updated' : 'added'} successfully.`,
      })
    } catch (error) {
      notify({
        variant: 'error',
        title: 'Error',
        description: error.message || 'We could not create the page.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredPages = pages.filter((page) => {
    if (!normalizedSearchQuery) return true

    return [page.id, page.pageKey, page.displayName, page.pageType, page.route, page.iconKey]
      .some((value) => String(value ?? '').toLowerCase().includes(normalizedSearchQuery))
  })

  return (
    <Box sx={{ minHeight: '100%' }}>
      <Box
        sx={{
          width: '100%',
          mb: 1.5,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          placeholder="Search pages"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          sx={{
            flex: { xs: 1, sm: 'none' },
            width: { xs: 'auto', sm: 320 },
            '& .MuiOutlinedInput-root': {
              height: 36,
              borderRadius: '4px',
            },
          }}
          inputProps={{ 'aria-label': 'Search pages' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        {isMobile ? (
          <IconButton
            aria-label="Add page"
            title="Add page"
            onClick={openAddDialog}
            sx={{
              width: 36,
              height: 36,
              p: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #1f2937',
              borderRadius: '4px',
              color: '#111827',
            }}
          >
            <Box component="span" aria-hidden sx={{ fontSize: 32, fontWeight: 400, lineHeight: 1 }}>
              +
            </Box>
          </IconButton>
        ) : (
          <Button
            variant="contained"
            startIcon={<PlaylistAddRoundedIcon />}
            onClick={openAddDialog}
            sx={{
              textTransform: 'none',
              boxShadow: 'none',
              borderRadius: '4px',
            }}
          >
            Add Page
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} square elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 0 }}>
        <Table aria-label="Page master table" size="small" sx={{ '& .MuiTableCell-root': { py: 0.35 }, '& .MuiIconButton-root': { p: 0.25 } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ width: 70, fontWeight: 700 }}>#</TableCell>
              <TableCell sx={{ width: 70, fontWeight: 700 }}>Icon</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Page name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Display name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Page type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 4, color: '#718096', textAlign: 'center' }}>
                  Loading pages...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && filteredPages.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 4, color: '#718096', textAlign: 'center' }}>
                  {normalizedSearchQuery ? 'No matching pages.' : 'No pages found.'}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && filteredPages.map((page, index) => (
              <TableRow key={page.id} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: '#53635e' }}>
                    {(() => {
                      const PageIcon = pageIconsByKey[page.iconKey] || pageIconsByKey.dashboard
                      return <PageIcon fontSize="small" />
                    })()}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{page.pageKey}</Typography>
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>{page.displayName}</TableCell>
                <TableCell sx={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                  {page.pageType}
                </TableCell>
                <TableCell sx={{ color: '#53635e', fontFamily: 'monospace', fontSize: 12 }}>
                  {page.route}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      aria-label={`Edit ${page.displayName}`}
                      title="Edit"
                      onClick={() => openEditDialog(page)}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <Switch
                      size="small"
                      checked={page.isActive}
                      color="success"
                      inputProps={{
                        'aria-label': `${page.isActive ? 'Disable' : 'Enable'} ${page.displayName}`,
                      }}
                      onClick={() => togglePageStatus(page)}
                      disabled={updatingPageId === page.id}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={addDialogOpen}
        onClose={closeAddDialog}
        fullWidth
        maxWidth="sm"
        aria-labelledby="add-page-dialog-title"
        slotProps={{
          paper: {
            sx: { borderRadius: '4px' },
          },
        }}
      >
        <Box component="form" onSubmit={createPage}>
          <DialogTitle id="add-page-dialog-title">{editingPage ? 'Edit Page' : 'Add Page'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Page name"
                placeholder="customer-list"
                size="small"
                sx={compactFieldSx}
                value={form.pageKey}
                onChange={handleFormChange('pageKey')}
                helperText="Use lowercase letters, numbers, and hyphens."
                required
                fullWidth
              />
              <TextField
                label="Display name"
                placeholder="Customer List"
                size="small"
                sx={compactFieldSx}
                value={form.displayName}
                onChange={handleFormChange('displayName')}
                required
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth required size="small" sx={compactFieldSx}>
                  <InputLabel id="page-type-label">Page type</InputLabel>
                  <Select
                    labelId="page-type-label"
                    label="Page type"
                    value={form.pageType}
                    onChange={handleFormChange('pageType')}
                  >
                    <MenuItem value="tenant">Tenant</MenuItem>
                    <MenuItem value="platform">Platform</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth required size="small" sx={compactFieldSx}>
                  <InputLabel id="page-icon-label">Icon</InputLabel>
                  <Select
                    labelId="page-icon-label"
                    label="Icon"
                    value={form.iconKey}
                    onChange={handleFormChange('iconKey')}
                    renderValue={(selected) => {
                      const selectedOption = pageIconOptions.find(([key]) => key === selected)
                      if (!selectedOption) return selected

                      const [, selectedLabel, SelectedIcon] = selectedOption
                      return (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <SelectedIcon fontSize="small" />
                          <span>{selectedLabel}</span>
                        </Stack>
                      )
                    }}
                    MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
                  >
                    {pageIconOptions.map(([key, label, Icon]) => (
                      <MenuItem key={key} value={key}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Icon fontSize="small" />
                          <span>{label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Box>
                <Typography sx={{ mb: 0.5, fontSize: 13, fontWeight: 700 }}>Action permissions</Typography>
                <FormGroup row>
                  {[
                    ['view', 'View'],
                    ['create', 'Create'],
                    ['update', 'Update'],
                    ['delete', 'Delete'],
                    ['export', 'Export'],
                  ].map(([key, label]) => {
                    const isExistingPermission = Boolean(editingPage?.actions?.includes(key))

                    return (
                      <FormControlLabel
                        key={key}
                        control={<Checkbox size="small" checked={form.actions.includes(key)} onChange={toggleAction(key)} disabled={isExistingPermission} />}
                        label={label}
                      />
                    )
                  })}
                </FormGroup>
                {editingPage && <Typography sx={{ fontSize: 12, color: '#718096' }}>Existing permissions cannot be removed.</Typography>}
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Route"
                  placeholder="/app/customer-list"
                  size="small"
                  sx={compactFieldSx}
                  value={form.route}
                  onChange={handleFormChange('route')}
                  required
                  fullWidth
                />
                <TextField
                  label="Sort order"
                  type="number"
                  size="small"
                  sx={compactFieldSx}
                  value={form.sortOrder}
                  onChange={handleFormChange('sortOrder')}
                  inputProps={{ min: 0, step: 1 }}
                  required
                  fullWidth
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeAddDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving} sx={{ borderRadius: '4px' }}>
              {isSaving ? 'Saving...' : editingPage ? 'Save Changes' : 'Add Page'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default PageMasterPage
