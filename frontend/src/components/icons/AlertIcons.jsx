// Icons by Streamline, CC BY 4.0.

function Icon({ children, className = 'h-5 w-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function InformationCircleIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.5v5" />
      <path d="M12 7.5h.01" />
    </Icon>
  )
}

export function CheckCircleIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </Icon>
  )
}

export function WarningTriangleIcon(props) {
  return (
    <Icon {...props}>
      <path d="m10.5 4.2-7 12.2A1.6 1.6 0 0 0 4.9 18.8h14.2a1.6 1.6 0 0 0 1.4-2.4l-7-12.2a1.7 1.7 0 0 0-3 0Z" />
      <path d="M12 8.5v4.5" />
      <path d="M12 16h.01" />
    </Icon>
  )
}

export function ErrorCircleIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </Icon>
  )
}

export function CloseIcon(props) {
  return (
    <Icon {...props} className={props.className || 'h-4 w-4'}>
      <path d="m7 7 10 10" />
      <path d="m17 7-10 10" />
    </Icon>
  )
}
