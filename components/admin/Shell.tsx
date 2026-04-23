'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OpIcon, type OpIconName } from './Icon'

type NavItem = {
  href: string
  id: string
  label: string
  icon: OpIconName
  badge?: number | null
  hot?: boolean
}

export type Impersonation = {
  workspaceName: string
  ownerEmail: string
} | null

type Props = {
  adminName: string
  adminInitials: string
  counts: {
    workspaces: number
    catalogPending: number
    billingTasks: number
  }
  children: React.ReactNode
  impersonation?: Impersonation
}

const CRUMB_LABEL: Record<string, string> = {
  overview: 'Overview',
  workspaces: 'Workspaces',
  catalog: 'Global catalog',
  users: 'Users',
  audit: 'Audit log',
  activity: 'Activity',
  billing: 'Billing',
}

function pageFromPath(path: string): string {
  if (path.startsWith('/admin/workspaces')) return 'workspaces'
  if (path.startsWith('/admin/catalog')) return 'catalog'
  if (path.startsWith('/admin/users')) return 'users'
  if (path.startsWith('/admin/audit')) return 'audit'
  if (path.startsWith('/admin/activity')) return 'activity'
  if (path.startsWith('/admin/billing')) return 'billing'
  return 'overview'
}

export function OpShell({ adminName, adminInitials, counts, children, impersonation }: Props) {
  const pathname = usePathname() ?? '/admin'
  const activePage = pageFromPath(pathname)
  const crumbs = ['Operator', CRUMB_LABEL[activePage] ?? 'Overview']

  const navMain: NavItem[] = [
    { id: 'overview', href: '/admin', label: 'Overview', icon: 'grid' },
    {
      id: 'workspaces',
      href: '/admin/workspaces',
      label: 'Workspaces',
      icon: 'workspaces',
      badge: counts.workspaces,
    },
    {
      id: 'catalog',
      href: '/admin/catalog',
      label: 'Global catalog',
      icon: 'catalog',
      badge: counts.catalogPending,
      hot: counts.catalogPending > 0,
    },
    { id: 'users', href: '/admin/users', label: 'Users', icon: 'users' },
  ]
  const navOps: NavItem[] = [
    {
      id: 'billing',
      href: '/admin/billing',
      label: 'Billing actions',
      icon: 'billing',
      badge: counts.billingTasks,
    },
    { id: 'emails', href: '/admin/emails', label: 'Email templates', icon: 'audit' },
    { id: 'audit', href: '/admin/audit', label: 'Audit log', icon: 'audit' },
    { id: 'activity', href: '/admin/activity', label: 'Activity', icon: 'audit' },
  ]

  return (
    <div className="op-scope">
      <div className="op-app">
        <aside className="op-sidebar">
          <Link href="/admin" className="op-logo">
            <div className="mark">S</div>
            <div className="n">
              <b>ShakeBase</b>
              <small>Operator</small>
            </div>
          </Link>

          <div className="op-nav-sec">
            <div className="op-nav-head">Platform</div>
            {navMain.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className="op-nav-item"
                data-active={activePage === n.id}
              >
                <OpIcon name={n.icon} />
                <span>{n.label}</span>
                {n.badge != null && n.badge > 0 && (
                  <span className={'badge' + (n.hot ? ' hot' : '')}>{n.badge}</span>
                )}
              </Link>
            ))}
          </div>

          <div className="op-nav-sec">
            <div className="op-nav-head">Operations</div>
            {navOps.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className="op-nav-item"
                data-active={activePage === n.id}
              >
                <OpIcon name={n.icon} />
                <span>{n.label}</span>
                {n.badge != null && n.badge > 0 && <span className="badge">{n.badge}</span>}
              </Link>
            ))}
          </div>

          <div className="op-me">
            <div className="ava">{adminInitials}</div>
            <div style={{ lineHeight: 1.3 }}>
              <div>
                <b>{adminName}</b>
              </div>
              <small>Superadmin</small>
            </div>
          </div>
        </aside>

        <div className="op-main">
          <div className="op-topbar">
            <div className="op-crumbs">
              {crumbs.map((c, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {i > 0 && <span className="sep">/</span>}
                  {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
                </span>
              ))}
            </div>

            <div className="op-search">
              <OpIcon name="search" size={13} />
              <span>Search workspaces, users, cocktails…</span>
              <kbd>⌘K</kbd>
            </div>
          </div>

          {impersonation && (
            <div className="op-impersonate">
              <span className="dot"></span>
              <span className="tag">Impersonating</span>
              <span className="who">
                You are signed in as <b>{impersonation.ownerEmail}</b> ·{' '}
                <b>{impersonation.workspaceName}</b>
              </span>
              <form action="/admin/impersonate/end" method="POST" style={{ marginLeft: 'auto' }}>
                <button type="submit" className="exit">
                  Exit session
                </button>
              </form>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
