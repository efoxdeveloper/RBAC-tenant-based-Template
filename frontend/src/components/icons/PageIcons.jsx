// Icons by Streamline, CC BY 4.0.

function PageIcon({ iconKey, className = 'h-5 w-5' }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
  }

  if (iconKey === 'dashboard') {
    return <svg {...commonProps}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>
  }

  if (iconKey === 'inbox') {
    return <svg {...commonProps}><path d="M4 5h16v11H4z" /><path d="M4 16h4l1.5 2h5L16 16h4" /><path d="M8 9h8" /></svg>
  }

  if (iconKey === 'tickets') {
    return <svg {...commonProps}><path d="M6 3.5h9l3 3V20.5H6z" /><path d="M15 3.5v3h3" /><path d="M9 11h6M9 14.5h6" /></svg>
  }

  if (iconKey === 'customers') {
    return <svg {...commonProps}><circle cx="9" cy="8" r="3" /><circle cx="16.5" cy="9.5" r="2.5" /><path d="M3.5 19c.4-3.2 2.2-5 5.5-5s5.1 1.8 5.5 5" /><path d="M14.5 14.5c2.8.1 4.5 1.6 5 4.5" /></svg>
  }

  if (iconKey === 'reports') {
    return <svg {...commonProps}><path d="M5 19.5V13M12 19.5V8M19 19.5V4.5" /><path d="M3.5 19.5h17" /></svg>
  }

  if (iconKey === 'settings') {
    return <svg {...commonProps}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6.4v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1H15v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
  }

  return <svg {...commonProps}><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></svg>
}

export default PageIcon
