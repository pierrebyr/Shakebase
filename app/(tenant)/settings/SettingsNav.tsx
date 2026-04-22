'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/icons'

type Section = {
  id: string
  label: string
  icon: IconName
  group: 'Account' | 'Workspace' | 'Data'
  ownerOnly?: boolean
}

const SECTIONS: Section[] = [
  { id: 'profile', label: 'Profile', icon: 'user', group: 'Account' },
  { id: 'security', label: 'Security', icon: 'lock', group: 'Account' },
  { id: 'sessions', label: 'Sessions', icon: 'clock', group: 'Account' },
  { id: 'general', label: 'General', icon: 'settings', group: 'Workspace', ownerOnly: true },
  { id: 'appearance', label: 'Appearance', icon: 'sparkle', group: 'Workspace', ownerOnly: true },
  // Notifications prefs are scoped per-user (user_notification_prefs keyed on
  // user_id + workspace_id), so every member gets their own settings.
  { id: 'notifications', label: 'Notifications', icon: 'bell', group: 'Workspace' },
  // Team is visible to everyone (read-only for non-owners).
  { id: 'team', label: 'Team & roles', icon: 'users', group: 'Workspace' },
  { id: 'integrations', label: 'Integrations', icon: 'plug', group: 'Data', ownerOnly: true },
  { id: 'billing', label: 'Billing', icon: 'card', group: 'Data', ownerOnly: true },
  { id: 'export', label: 'Data & export', icon: 'download', group: 'Data', ownerOnly: true },
]

// Sections that already have a real page (not coming-soon stubs).
// Everything else renders as a muted, non-clickable row.
const LIVE_IDS = new Set([
  'profile', // maps to /settings (root)
  'security',
  'sessions',
  'general',
  'appearance',
  'notifications',
  'team',
  'integrations',
  'billing',
  'export',
])

export function SettingsNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname() ?? ''
  const visible = SECTIONS.filter((s) => isOwner || !s.ownerOnly)
  const groups: Section['group'][] = ['Account', 'Workspace', 'Data']

  return (
    <nav
      className="col"
      style={{ gap: 2, position: 'sticky', top: 96, alignSelf: 'start' }}
    >
      {groups.map((g) => {
        const sectionsInGroup = visible.filter((s) => s.group === g)
        if (sectionsInGroup.length === 0) return null
        return (
        <div key={g}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink-4)',
              padding: '10px 12px 6px',
            }}
          >
            {g}
          </div>
          {sectionsInGroup.map((s) => {
            const live = LIVE_IDS.has(s.id)
            const href = s.id === 'profile' ? '/settings' : `/settings/${s.id}`
            const active = s.id === 'profile' ? pathname === '/settings' : pathname === href
            const rowStyle = {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 10,
              fontSize: 13,
              color: active ? 'var(--ink-1)' : 'var(--ink-3)',
              background: active ? 'var(--accent-wash)' : 'transparent',
              fontWeight: active ? 500 : 400,
              opacity: live ? 1 : 0.55,
            } as const
            if (!live) {
              return (
                <div key={s.id} style={{ ...rowStyle, cursor: 'default' }}>
                  <Icon name={s.icon} size={16} />
                  <span>{s.label}</span>
                </div>
              )
            }
            return (
              <Link key={s.id} href={href} style={rowStyle}>
                <Icon name={s.icon} size={16} />
                <span>{s.label}</span>
              </Link>
            )
          })}
        </div>
        )
      })}
    </nav>
  )
}
