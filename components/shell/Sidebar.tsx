'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/icons'
import { Avatar } from '@/components/cocktail/Avatar'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'

type NavItem = {
  href: string
  label: string
  icon: IconName
  badge?: string
}

export type PinnedCocktail = {
  id: string
  slug: string
  name: string
  orb_from: string | null
  orb_to: string | null
}

const PRIMARY: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: 'home' },
  { href: '/cocktails', label: 'Cocktails', icon: 'cup' },
  { href: '/cocktails/favorites', label: 'Favorites', icon: 'heart' },
  { href: '/collections', label: 'Collections', icon: 'bookmark' },
  { href: '/products', label: 'Products', icon: 'beaker' },
  { href: '/creators', label: 'Creators', icon: 'user' },
  { href: '/ingredients', label: 'Ingredients', icon: 'leaf' },
]

const WORKFLOWS: NavItem[] = [
  { href: '/cocktails/new', label: 'New Cocktail', icon: 'plus' },
  { href: '/analytics', label: 'Analytics', icon: 'analytics' },
]

type Props = {
  workspaceName: string
  workspaceEnv?: string
  user: { fullName: string; jobTitle?: string | null }
  pinned: PinnedCocktail[]
}

export function Sidebar({
  workspaceName,
  workspaceEnv = 'R&D',
  user,
  pinned = [],
}: Props) {
  const pathname = usePathname()
  const allHrefs = [...PRIMARY, ...WORKFLOWS].map((n) => n.href)
  const isActive = (href: string) => {
    if (!pathname) return false
    if (pathname === href) return true
    if (href === '/dashboard') return false
    if (!pathname.startsWith(href + '/') && pathname !== href) return false
    // If a longer sibling href also matches, defer to it.
    const moreSpecific = allHrefs.some(
      (h) => h !== href && h.startsWith(href + '/') && (pathname === h || pathname.startsWith(h + '/')),
    )
    return !moreSpecific
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div className="brand-name">{workspaceName}</div>
        <div className="brand-env">{workspaceEnv}</div>
      </div>

      <div className="nav-group">
        <div className="nav-label">Library</div>
        {PRIMARY.map((n) => (
          <Link key={n.href} href={n.href} className="nav-item" data-active={isActive(n.href)}>
            <Icon name={n.icon} className="nav-ico" />
            <span>{n.label}</span>
            {n.badge && <span className="nav-badge">{n.badge}</span>}
          </Link>
        ))}
      </div>

      <div className="nav-group">
        <div className="nav-label">Workflows</div>
        {WORKFLOWS.map((n) => (
          <Link key={n.href} href={n.href} className="nav-item" data-active={isActive(n.href)}>
            <Icon name={n.icon} className="nav-ico" />
            <span>{n.label}</span>
          </Link>
        ))}
      </div>

      {pinned.length > 0 && (
        <div className="nav-group">
          <div className="nav-label">Pinned</div>
          {pinned.map((c) => (
            <Link
              key={c.id}
              href={`/cocktails/${c.slug}`}
              className="nav-item"
              data-active={pathname === `/cocktails/${c.slug}`}
            >
              <DrinkOrb from={c.orb_from ?? '#f4efe0'} to={c.orb_to ?? '#c9b89a'} size={16} />
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/settings"
        className="sidebar-foot"
        data-active={pathname?.startsWith('/settings') ? true : false}
        aria-label="Open settings"
      >
        <Avatar name={user.fullName} />
        <div className="col" style={{ lineHeight: 1.2 }}>
          <strong style={{ fontSize: 12.5, fontWeight: 500 }}>{user.fullName}</strong>
          {user.jobTitle && (
            <small style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{user.jobTitle}</small>
          )}
        </div>
      </Link>
    </aside>
  )
}
