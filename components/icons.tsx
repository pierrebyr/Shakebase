import type { SVGProps } from 'react'

export type IconName =
  | 'home'
  | 'grid'
  | 'list'
  | 'user'
  | 'flask'
  | 'plus'
  | 'analytics'
  | 'search'
  | 'bell'
  | 'settings'
  | 'chevron-r'
  | 'chevron-l'
  | 'chevron-d'
  | 'arrow-r'
  | 'arrow-up'
  | 'arrow-down'
  | 'star'
  | 'bookmark'
  | 'heart'
  | 'heart-filled'
  | 'folder'
  | 'filter'
  | 'sparkle'
  | 'check'
  | 'x'
  | 'edit'
  | 'share'
  | 'time'
  | 'pin'
  | 'globe'
  | 'leaf'
  | 'fire'
  | 'cup'
  | 'beaker'
  | 'menu'
  | 'dot'
  | 'lock'
  | 'clock'
  | 'users'
  | 'plug'
  | 'card'
  | 'download'
  | 'phone'
  | 'monitor'
  | 'file'
  | 'glass-coupe'
  | 'glass-nicknora'
  | 'glass-rocks'
  | 'glass-highball'
  | 'glass-collins'
  | 'glass-flute'
  | 'glass-snifter'
  | 'glass-tiki'
  | 'glass-wine'
  | 'more'
  | 'trash'
  | 'instagram'
  | 'linkedin'
  | 'external-link'

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
  size?: number
}

export function Icon({ name, size = 16, ...rest }: IconProps) {
  const common: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
  }

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 11l8-7 8 7" />
          <path d="M5 10v9h14v-9" />
        </svg>
      )
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'list':
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        </svg>
      )
    case 'flask':
      return (
        <svg {...common}>
          <path d="M9 3v6.5L4 19a2 2 0 002 3h12a2 2 0 002-3l-5-9.5V3" />
          <path d="M8 3h8" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'analytics':
      return (
        <svg {...common}>
          <path d="M4 20V8M10 20V4M16 20v-7M22 20H2" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4-4" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common}>
          <path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5L6 16z" />
          <path d="M10 21h4" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.4.9a7 7 0 00-2-1.2l-.4-2.6h-4l-.4 2.6a7 7 0 00-2 1.2l-2.4-.9-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.9c.6.5 1.3.9 2 1.2l.4 2.6h4l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
        </svg>
      )
    case 'chevron-r':
      return (
        <svg {...common}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      )
    case 'chevron-l':
      return (
        <svg {...common}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      )
    case 'chevron-d':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      )
    case 'arrow-r':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )
    case 'arrow-up':
      return (
        <svg {...common}>
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      )
    case 'arrow-down':
      return (
        <svg {...common}>
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 3l2.6 5.6 6 .7-4.4 4 1.2 6L12 16.8 6.6 19.3l1.2-6L3.4 9.3l6-.7L12 3z" />
        </svg>
      )
    case 'bookmark':
      return (
        <svg {...common}>
          <path d="M6 4h12v16l-6-4-6 4V4z" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
        </svg>
      )
    case 'heart-filled':
      return (
        <svg {...common} fill="currentColor" stroke="currentColor">
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
        </svg>
      )
    case 'folder':
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
      )
    case 'filter':
      return (
        <svg {...common}>
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M6.5 17.5L9 15M15 9l2.5-2.5" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 12l4 4 10-10" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common}>
          <path d="M4 20h4l11-11-4-4L4 16v4z" />
        </svg>
      )
    case 'share':
      return (
        <svg {...common}>
          <path d="M12 4v12M7 9l5-5 5 5M5 17v3h14v-3" />
        </svg>
      )
    case 'time':
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 2l4 4-1 6 3 3-7 1-3 7-1-3-3-3 6-1 4-1z" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 3 4 6 4 9s-1.5 6-4 9c-2.5-3-4-6-4-9s1.5-6 4-9z" />
        </svg>
      )
    case 'leaf':
      return (
        <svg {...common}>
          <path d="M5 19c10 0 15-5 15-15-10 0-15 5-15 15z" />
          <path d="M5 19l8-8" />
        </svg>
      )
    case 'fire':
      return (
        <svg {...common}>
          <path d="M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-3 2-3 2-6 1 1 2 2 3-4z" />
        </svg>
      )
    case 'cup':
      return (
        <svg {...common}>
          <path d="M5 4h14l-2 8a5 5 0 01-10 0L5 4z" />
          <path d="M9 18h6" />
          <path d="M12 14v4" />
        </svg>
      )
    case 'beaker':
      return (
        <svg {...common}>
          <path d="M9 3h6" />
          <path d="M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" />
          <path d="M7 16h10" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h10M4 17h16" />
        </svg>
      )
    case 'dot':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" />
          <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M15 20c0-2 2-4 4-4s2 2 2 4" />
        </svg>
      )
    case 'plug':
      return (
        <svg {...common}>
          <path d="M9 3v6M15 3v6" />
          <path d="M6 9h12v3a6 6 0 11-12 0V9z" />
          <path d="M12 18v3" />
        </svg>
      )
    case 'card':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3v13M6 11l6 6 6-6" />
          <path d="M4 21h16" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M11 18h2" />
        </svg>
      )
    case 'monitor':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M9 21h6M12 17v4" />
        </svg>
      )
    case 'file':
      return (
        <svg {...common}>
          <path d="M6 3h8l4 4v14H6V3z" />
          <path d="M14 3v4h4" />
        </svg>
      )
    case 'glass-coupe':
      return (
        <svg {...common}>
          <path d="M5 6h14c0 4-3 7-7 7s-7-3-7-7z" />
          <path d="M12 13v6" />
          <path d="M8 20h8" />
        </svg>
      )
    case 'glass-nicknora':
      return (
        <svg {...common}>
          <path d="M7 5h10l-1 5a4 4 0 01-8 0l-1-5z" />
          <path d="M12 14v5" />
          <path d="M9 20h6" />
        </svg>
      )
    case 'glass-rocks':
      return (
        <svg {...common}>
          <path d="M6 6h12v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6z" />
          <path d="M6 11h12" />
        </svg>
      )
    case 'glass-highball':
      return (
        <svg {...common}>
          <path d="M7 3h10l-1 17a2 2 0 01-2 2h-4a2 2 0 01-2-2L7 3z" />
          <path d="M7.5 9h9" />
        </svg>
      )
    case 'glass-collins':
      return (
        <svg {...common}>
          <path d="M7.5 3h9l-0.8 18a2 2 0 01-2 1.9h-3.4a2 2 0 01-2-1.9L7.5 3z" />
        </svg>
      )
    case 'glass-flute':
      return (
        <svg {...common}>
          <path d="M9 3h6l-1 13a2 2 0 01-4 0L9 3z" />
          <path d="M12 16v4" />
          <path d="M9 20h6" />
        </svg>
      )
    case 'glass-snifter':
      return (
        <svg {...common}>
          <path d="M6 9c0 4 3 7 6 7s6-3 6-7V6H6v3z" />
          <path d="M12 16v3" />
          <path d="M8 20h8" />
        </svg>
      )
    case 'glass-tiki':
      return (
        <svg {...common}>
          <path d="M7 5h10v3c0 5-2 12-5 12s-5-7-5-12V5z" />
          <circle cx="10" cy="10" r="1" />
          <circle cx="14" cy="10" r="1" />
          <path d="M10 14c1 1 3 1 4 0" />
        </svg>
      )
    case 'glass-wine':
      return (
        <svg {...common}>
          <path d="M7 4h10c0 5-2 9-5 9s-5-4-5-9z" />
          <path d="M12 13v6" />
          <path d="M8 20h8" />
        </svg>
      )
    case 'more':
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M10 11v6M14 11v6" />
          <path d="M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13" />
          <path d="M9 7V4h6v3" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <rect x="6.6" y="10" width="1.6" height="7" fill="currentColor" stroke="none" />
          <circle cx="7.4" cy="7.5" r="1.05" fill="currentColor" stroke="none" />
          <path d="M11 10v7" />
          <path d="M11 13.5c0-2 1-3.5 2.7-3.5S16 11.5 16 13.5V17" />
        </svg>
      )
    case 'external-link':
      return (
        <svg {...common}>
          <path d="M10 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-4" />
          <path d="M14 4h6v6" />
          <path d="M20 4l-9 9" />
        </svg>
      )
    default:
      return null
  }
}

export const GLASS_ICONS: Record<string, IconName> = {
  Coupe: 'glass-coupe',
  'Nick & Nora': 'glass-nicknora',
  Rocks: 'glass-rocks',
  Highball: 'glass-highball',
  Collins: 'glass-collins',
  Flute: 'glass-flute',
  Snifter: 'glass-snifter',
  'Tiki mug': 'glass-tiki',
  'Wine glass': 'glass-wine',
}
