import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import packageInfo from '../../package.json'
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded'
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import DomainRoundedIcon from '@mui/icons-material/DomainRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { pageIconsByKey } from '../components/icons/pageIconOptions.jsx'

const expandedWidth = 200
const collapsedWidth = 76

function SidebarContents({ collapsed, onToggle, onNavigate, navigation }) {
  const items = navigation.map((page) => ({
    label: page.displayName,
    path: page.route,
    icon: pageIconsByKey[page.iconKey] || SettingsRoundedIcon,
  }))

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: collapsed ? 1 : 1.5, py: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent={collapsed ? 'center' : 'flex-start'} sx={{ position: 'relative', width: '100%', height: 34, mb: 1.5, px: 0.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, height: '100%' }}>
          <Box sx={{ width: 27, height: 27, flexShrink: 0, alignSelf: 'center', display: 'grid', placeItems: 'center', borderRadius: '50%', color: '#fff', bgcolor: '#0079f5' }}>
            <SupportAgentRoundedIcon sx={{ fontSize: 16, display: 'block' }} />
          </Box>
          {!collapsed && (
            <Typography noWrap sx={{ height: '100%', display: 'flex', alignItems: 'center', fontSize: 14, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.03em' }}>
              <Box component="span" sx={{ color: '#111111' }}>Support</Box>
              <Box component="span" sx={{ color: '#0079f5' }}> CRM</Box>
            </Typography>
          )}
        </Stack>
        {!collapsed && (
          <IconButton size="small" aria-label="Collapse sidebar" onClick={onToggle} sx={{ position: 'absolute', top: '50%', right: -8, transform: 'translateY(-50%)', color: '#69716f', p: 0.25 }}>
            <KeyboardArrowLeftRoundedIcon fontSize="small" />
          </IconButton>
        )}
        {collapsed && (
          <IconButton size="small" aria-label="Expand sidebar" onClick={onToggle} sx={{ color: '#69716f', p: 0.25, position: 'absolute', right: 4, top: 18 }}>
            <KeyboardArrowRightRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Box component="nav" aria-label="Main navigation" sx={{ mt: 2 }}>
        <Stack spacing={0.25}>
          {items.map(({ label, path, icon: Icon }) => (
            <Box
              key={path}
              component={NavLink}
              to={path}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              sx={{
                minHeight: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 1,
                px: collapsed ? 0 : 1,
                borderRadius: 1.25,
                outline: 'none',
                color: '#434a48',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 500,
                '&:hover': {
                  marginLeft: collapsed ? '-8px' : '-12px',
                  width: collapsed ? 'calc(100% + 8px)' : 'calc(100% + 12px)',
                  paddingLeft: collapsed ? 0 : '20px',
                  borderRadius: '0 4px 4px 0',
                  bgcolor: '#f1f2f2',
                },
                '&.active': {
                  marginLeft: collapsed ? '-8px' : '-12px',
                  width: collapsed ? 'calc(100% + 8px)' : 'calc(100% + 12px)',
                  paddingLeft: collapsed ? 0 : '20px',
                  borderRadius: '0 4px 4px 0',
                  bgcolor: '#0079f5',
                  color: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                },
                '&:focus-visible': { boxShadow: 'inset 0 0 0 2px #89938f' },
              }}
            >
              <Icon sx={{ fontSize: 18, color: 'inherit', opacity: 0.88, flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1 }} />
      <Typography
        sx={{
          px: 0.5,
          pt: 0,
          textAlign: 'center',
          color: '#8a9190',
          fontSize: 10,
          lineHeight: 1.4,
        }}
      >
        {collapsed ? `v${packageInfo.version}` : `Version ${packageInfo.version}`}
      </Typography>
      <Typography
        component="a"
        href="https://www.efoxtechnologies.com/"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          px: 0.5,
          pb: 0.25,
          textAlign: 'center',
          color: '#8a9190',
          textDecoration: 'none',
          fontSize: 9,
          lineHeight: 1.4,
          '&:hover': { color: '#0079f5' },
        }}
      >
        Efox Technologies Pvt Ltd
      </Typography>

    </Box>
  )
}

function AppLayout({ currentUser, navigation, onLogout }) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const currentPage = navigation.find((item) => item.route === location.pathname)?.displayName ?? 'Settings'
  const closeMobileDrawer = () => setMobileOpen(false)
  const closeProfileMenu = () => setProfileMenuAnchor(null)
  const currentDrawerWidth = collapsed ? collapsedWidth : expandedWidth

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f1f3f4', color: '#172b27' }}>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: currentDrawerWidth,
          flexShrink: 0,
          transition: 'width 180ms ease',
          '& .MuiDrawer-paper': {
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            bgcolor: '#f1f3f4',
            borderRight: 0,
            borderRadius: 0,
            transition: 'width 180ms ease',
          },
        }}
      >
        <SidebarContents navigation={navigation} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={closeMobileDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: expandedWidth, boxSizing: 'border-box', bgcolor: '#f1f3f4', borderRight: 0, borderRadius: 0 },
        }}
      >
        <SidebarContents navigation={navigation} onNavigate={closeMobileDrawer} />
      </Drawer>

      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box component="header" sx={{
          height: 48, minHeight: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: { xs: 2, md: 4 }, bgcolor: '#f1f3f4', borderBottom: 0,
        }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton aria-label="Open navigation menu" onClick={() => setMobileOpen(true)} sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: -1, color: '#53635e' }}>
              <MenuRoundedIcon />
            </IconButton>
            <Typography sx={{ fontSize: 17, fontWeight: 600 }}>{currentPage}</Typography>
          </Stack>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            {currentUser?.tenantId && (
              <Box
                title={currentUser.tenantName || 'Tenant'}
                aria-label={currentUser.tenantName || 'Tenant'}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Avatar
                  variant="rounded"
                  src={currentUser.tenantLogoUrl || undefined}
                  alt={currentUser.tenantName || 'Tenant'}
                  sx={{ width: 'auto', height: 30, borderRadius: '4px', bgcolor: 'transparent', color: '#125b50' }}
                >
                  <DomainRoundedIcon sx={{ fontSize: 18 }} />
                </Avatar>
              </Box>
            )}
            {navigation.some((item) => item.route === '/app/settings') && (
              <IconButton
                component={NavLink}
                to="/app/settings"
                aria-label="Settings"
                title="Settings"
                sx={{ color: '#53635e', '&.active': { bgcolor: '#e5e8e7' } }}
              >
                <SettingsRoundedIcon />
              </IconButton>
            )}
            <IconButton aria-label="Notifications, 3 unread" title="Notifications" sx={{ color: '#53635e' }}>
              <Badge
                badgeContent={3}
                color="error"
                overlap="circular"
                sx={{ '& .MuiBadge-badge': { minWidth: 16, height: 16, px: 0.4, fontSize: 9, fontWeight: 700 } }}
              >
                <NotificationsRoundedIcon />
              </Badge>
            </IconButton>
            <Box
              component="button"
              type="button"
              aria-label="Open Admin account menu"
              aria-haspopup="menu"
              aria-expanded={Boolean(profileMenuAnchor)}
              aria-controls={profileMenuAnchor ? 'admin-profile-menu' : undefined}
              onClick={(event) => setProfileMenuAnchor(event.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 0,
                border: 0,
                bgcolor: 'transparent',
                color: 'inherit',
                font: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                '&:focus-visible': { outline: '2px solid #0079f5', outlineOffset: 2, borderRadius: 1 },
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#dcefe9', color: '#125b50', fontSize: 13, fontWeight: 700 }}>AD</Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{currentUser?.fullName || 'Admin'}</Typography>
                <Typography sx={{ fontSize: 10, color: '#84919a' }}>{currentUser?.roleName || 'Workspace owner'}</Typography>
              </Box>
            </Box>
          </Stack>
          <Menu
            id="admin-profile-menu"
            anchorEl={profileMenuAnchor}
            open={Boolean(profileMenuAnchor)}
            onClose={closeProfileMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  width: 292,
                  maxWidth: 'calc(100vw - 24px)',
                  mt: 1,
                  border: '1px solid #d7dde7',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
                  overflow: 'hidden',
                },
              },
              list: { sx: { py: 0 } },
            }}
          >
            <Box component="li" role="presentation" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1.25 }}>
              <Avatar sx={{ width: 42, height: 42, bgcolor: '#dcefe9', color: '#125b50', fontSize: 14, fontWeight: 700 }}>AD</Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{currentUser?.fullName || 'Admin'}</Typography>
                <Typography noWrap sx={{ fontSize: 11, color: '#718096' }}>{currentUser?.email || 'Workspace owner'}</Typography>
              </Box>
            </Box>
            <Box component="li" role="presentation" sx={{ px: 1.5, py: 1, bgcolor: '#f8fafc', borderTop: '1px solid #e7ebf0', borderBottom: '1px solid #e7ebf0' }}>
              {[
                ['Designation', currentUser?.roleName || 'Workspace owner'],
                ['Phone', 'Not added'],
              ].map(([label, value]) => (
                <Stack key={label} direction="row" sx={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 1, py: 0.35 }}>
                  <Typography sx={{ fontSize: 11, color: '#718096' }}>{label}</Typography>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#283345', textAlign: 'right' }}>{value}</Typography>
                </Stack>
              ))}
            </Box>
            <MenuItem onClick={closeProfileMenu} sx={{ minHeight: 38, px: 1.5, gap: 1, fontSize: 13, borderBottom: '1px solid #e7ebf0' }}>
              <NotificationsActiveRoundedIcon sx={{ fontSize: 17, color: '#283345' }} />
              <Box component="span" sx={{ flex: 1 }}>Notifications Active</Box>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16b981' }} />
            </MenuItem>
            <MenuItem onClick={closeProfileMenu} sx={{ minHeight: 38, px: 1.5, fontSize: 13, borderBottom: '1px solid #e7ebf0' }}>
              Change Password
            </MenuItem>
            <MenuItem onClick={() => { closeProfileMenu(); setLogoutDialogOpen(true) }} sx={{ minHeight: 40, px: 1.5, gap: 1, fontSize: 13, color: '#dc2626' }}>
              <LogoutRoundedIcon sx={{ fontSize: 17 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 }, overflow: 'auto', bgcolor: '#ffffff', borderRadius: { xs: '20px 20px 0 0', md: '20px 0 0 0' } }}>
          <Outlet />
        </Box>
      </Box>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        role="alertdialog"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        slotProps={{
          paper: {
            sx: { borderRadius: '4px' },
          },
        }}
      >
        <DialogTitle id="logout-dialog-title">Log out of Support CRM?</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            You will need to sign in again to access your workspace.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} autoFocus>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setLogoutDialogOpen(false)
              onLogout?.()
            }}
            color="error"
          >
            Log out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AppLayout
