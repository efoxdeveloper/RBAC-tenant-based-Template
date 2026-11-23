import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Auth from './auth/auth.jsx'
import AppLayout from './app/AppLayout.jsx'
import Dashboard from './app/Dashboard.jsx'
import PageMasterPage from './app/PageMasterPage.jsx'
import PlansPage from './app/PlansPage.jsx'
import PermissionsPage from './app/PermissionsPage.jsx'
import RolesPage from './app/RolesPage.jsx'
import SectionPage from './app/SectionPage.jsx'
import TenantsPage from './app/TenantsPage.jsx'
import { NotificationProvider } from './components/NotificationProvider.jsx'

function RequireAuth({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/auth" replace />
}

function DynamicPage({ navigation }) {
  const location = useLocation()
  const page = navigation.find((item) => item.route === location.pathname)

  if (!page) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <SectionPage title={page.displayName} description={`${page.displayName} workspace.`} />
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [navigation, setNavigation] = useState([])
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  const loadNavigation = async () => {
    const response = await fetch('/auth/navigation', { credentials: 'include' })

    if (!response.ok) {
      throw new Error('Unable to load navigation')
    }

    const payload = await response.json()
    setNavigation(payload.pages || [])
  }

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/auth/me', { credentials: 'include' })

        if (!response.ok) return

        const payload = await response.json()
        setCurrentUser(payload.user)
        await loadNavigation()
      } catch {
        setCurrentUser(null)
        setNavigation([])
      } finally {
        setIsAuthChecking(false)
      }
    }

    loadSession()
  }, [])

  useEffect(() => {
    const refreshNavigation = () => {
      loadNavigation().catch(() => {})
    }

    window.addEventListener('navigation-updated', refreshNavigation)
    return () => window.removeEventListener('navigation-updated', refreshNavigation)
  }, [])

  const handleAuthenticated = async (user) => {
    setCurrentUser(user)
    await loadNavigation()
  }

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setCurrentUser(null)
      setNavigation([])
    }
  }

  if (isAuthChecking) return null

  const isAuthenticated = Boolean(currentUser)

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/app/dashboard' : '/auth'} replace />} />
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Auth onAuthenticated={handleAuthenticated} />} />
          <Route path="/app" element={<RequireAuth isAuthenticated={isAuthenticated}><AppLayout currentUser={currentUser} navigation={navigation} onLogout={handleLogout} /></RequireAuth>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="settings" element={<SectionPage title="Settings" description="Manage your workspace preferences and team access." />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="permissions" element={<PermissionsPage currentUser={currentUser} />} />
            <Route path="roles" element={<RolesPage currentUser={currentUser} />} />
            <Route path="page-master" element={<PageMasterPage />} />
            <Route path="*" element={<DynamicPage navigation={navigation} />} />
          </Route>
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  )
}

export default App
