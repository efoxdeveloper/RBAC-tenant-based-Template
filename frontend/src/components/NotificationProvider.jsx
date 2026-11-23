import { createContext, useCallback, useContext, useState } from 'react'
import { AlertPresence } from './ui/alert.jsx'

const NotificationContext = createContext(null)

function NotificationProvider({ children }) {
  const [alerts, setAlerts] = useState([])

  const dismiss = useCallback((id) => {
    setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== id))
  }, [])

  const notify = useCallback(({ variant = 'information', title, description, duration = 6000 }) => {
    const id = crypto.randomUUID()

    setAlerts((currentAlerts) => [
      { id, variant, title, description },
      ...currentAlerts,
    ])

    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration)
    }
  }, [dismiss])

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[1400] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        <div className="pointer-events-auto flex flex-col gap-2">
          <AlertPresence alerts={alerts} onClose={dismiss} />
        </div>
      </div>
    </NotificationContext.Provider>
  )
}

function useNotification() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotification must be used inside NotificationProvider')
  }

  return context
}

export { NotificationProvider, useNotification }
