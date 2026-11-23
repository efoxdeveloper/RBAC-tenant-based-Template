import { useNotification } from '../NotificationProvider.jsx'

const alertCopy = {
  information: {
    title: 'Information',
    description: 'Anyone with a link can now view this file.',
  },
  success: {
    title: 'Success',
    description: 'The page permissions were saved successfully.',
  },
  warning: {
    title: 'Warning',
    description: 'This change will affect every user in this role.',
  },
  error: {
    title: 'Error',
    description: 'We could not save the page permissions.',
  },
}

function GradientAlertDemo() {
  const { notify } = useNotification()

  const addAlert = (variant) => {
    notify({ variant, ...alertCopy[variant] })
  }

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.keys(alertCopy).map((variant) => (
          <button
            key={variant}
            type="button"
            onClick={() => addAlert(variant)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium capitalize text-slate-700 transition-colors hover:bg-slate-50"
          >
            {variant}
          </button>
        ))}
      </div>
    </div>
  )
}

export default GradientAlertDemo
