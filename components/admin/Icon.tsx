import type { SVGProps } from 'react'

export type OpIconName =
  | 'grid'
  | 'workspaces'
  | 'catalog'
  | 'users'
  | 'audit'
  | 'billing'
  | 'search'
  | 'chevron'
  | 'chev-down'
  | 'arrow-up'
  | 'arrow-down'
  | 'check'
  | 'x'
  | 'more'
  | 'eye'
  | 'key'
  | 'lock'
  | 'unlock'
  | 'external'
  | 'merge'
  | 'edit'
  | 'filter'
  | 'refresh'
  | 'warning'
  | 'info'
  | 'plus'
  | 'impersonate'
  | 'shield'
  | 'calendar'
  | 'stripe'
  | 'sparkles'
  | 'dot'

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: OpIconName
  size?: number
}

export function OpIcon({ name, size = 14, strokeWidth = 1.6, ...rest }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  }

  switch (name) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'workspaces':
      return (
        <svg {...common}>
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 12l9 4 9-4" />
          <path d="M3 17l9 4 9-4" />
        </svg>
      )
    case 'catalog':
      return (
        <svg {...common}>
          <path d="M4 4h16v5H4z" />
          <path d="M4 13h16v7H4z" />
          <path d="M9 17h6" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2 20c.8-3.5 3.8-5.5 7-5.5s6.2 2 7 5.5" />
          <circle cx="17" cy="7" r="2.5" />
          <path d="M22 18c-.4-1.8-1.8-3-3.6-3.3" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...common}>
          <path d="M7 3h8l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M10 13h7M10 17h5" />
        </svg>
      )
    case 'billing':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      )
    case 'chev-down':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      )
    case 'arrow-up':
      return (
        <svg {...common}>
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      )
    case 'arrow-down':
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M6 18L18 6" />
        </svg>
      )
    case 'more':
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'key':
      return (
        <svg {...common}>
          <circle cx="7" cy="15" r="4" />
          <path d="M10 12l10-10" />
          <path d="M15 7l3 3" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      )
    case 'unlock':
      return (
        <svg {...common}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 7.5-2" />
        </svg>
      )
    case 'external':
      return (
        <svg {...common}>
          <path d="M14 4h6v6" />
          <path d="M20 4L10 14" />
          <path d="M20 14v6H4V4h6" />
        </svg>
      )
    case 'merge':
      return (
        <svg {...common}>
          <path d="M6 3v6a4 4 0 0 0 4 4h8" />
          <path d="M18 3v6" />
          <path d="m15 6 3-3 3 3" />
          <path d="M18 13v8" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common}>
          <path d="M4 20h4L20 8l-4-4L4 16v4z" />
        </svg>
      )
    case 'filter':
      return (
        <svg {...common}>
          <path d="M3 5h18l-7 9v5l-4 2v-7z" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...common}>
          <path d="M12 3 2 20h20L12 3z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r=".6" fill="currentColor" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="8" r=".6" fill="currentColor" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'impersonate':
      return (
        <svg {...common}>
          <path d="M4 20c1.5-3 4-4.5 8-4.5s6.5 1.5 8 4.5" />
          <circle cx="12" cy="8" r="4" />
          <path d="m15 9 2 2 4-4" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      )
    case 'stripe':
      return (
        <svg {...common}>
          <path d="M7 8.5c0-1 1-1.5 2.5-1.5S13 7.5 13 9M13 13c-.2 1.5-1.5 2.5-3.5 2.5S6 14.5 6 13" />
          <path d="M17 7l-3 10" />
          <path d="M15 10h5M14 14h5" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg {...common}>
          <path d="m12 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
          <path d="M19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
        </svg>
      )
    case 'dot':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}
