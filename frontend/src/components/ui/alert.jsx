import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils.js'
import {
  CheckCircleIcon,
  CloseIcon,
  ErrorCircleIcon,
  InformationCircleIcon,
  WarningTriangleIcon,
} from '../icons/AlertIcons.jsx'

const alertVariants = cva(
  'relative w-full overflow-hidden rounded-lg border p-4 pl-12 shadow-sm',
  {
    variants: {
      variant: {
        information: 'border-blue-200 bg-blue-50 text-blue-950',
        success: 'border-green-200 bg-green-50 text-green-950',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-950',
        error: 'border-red-200 bg-red-50 text-red-950',
      },
    },
    defaultVariants: {
      variant: 'information',
    },
  },
)

const iconVariants = cva(
  'absolute left-0 top-0 flex h-full w-10 items-center justify-center',
  {
    variants: {
      variant: {
        information: 'bg-blue-500/10 text-blue-600',
        success: 'bg-green-500/10 text-green-600',
        warning: 'bg-yellow-500/10 text-yellow-700',
        error: 'bg-red-500/10 text-red-600',
      },
    },
    defaultVariants: {
      variant: 'information',
    },
  },
)

const icons = {
  information: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: WarningTriangleIcon,
  error: ErrorCircleIcon,
}

const GradientAlert = React.forwardRef(function GradientAlert(
  {
    className,
    variant = 'information',
    title,
    description,
    onClose,
    ...props
  },
  ref,
) {
  const Icon = icons[variant] || icons.information

  return (
    <motion.div
      ref={ref}
      role="alert"
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-20 [background:radial-gradient(circle_at_40px_40px,currentColor_0%,transparent_40%)]"
        aria-hidden="true"
      />

      <div className={cn(iconVariants({ variant }))}>
        <Icon />
      </div>

      <div className="relative flex-grow">
        <h5 className="font-medium">{title}</h5>
        <p className="text-sm opacity-75">{description}</p>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-3 top-3 rounded-full p-1 opacity-50 transition-colors hover:bg-black/5 hover:opacity-100"
        >
          <CloseIcon />
        </button>
      )}
    </motion.div>
  )
})

GradientAlert.displayName = 'GradientAlert'

function AlertPresence({ alerts, onClose }) {
  return (
    <AnimatePresence initial={false}>
      {alerts.map(({ id, ...alert }) => (
        <GradientAlert key={id} {...alert} onClose={() => onClose(id)} />
      ))}
    </AnimatePresence>
  )
}

export { AlertPresence, GradientAlert, alertVariants }
