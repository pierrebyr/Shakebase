import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import {
  timeAgo,
  wsColor,
  wsGlyph,
  statusLabel,
  statusTone,
} from '@/lib/admin/format'
import { WorkspacesFilters } from './WorkspacesFilters'

type WorkspaceRow = {
  id: string
  slug: string
  name: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
  stripe_customer_id: string | null
}

type Params = { searchParams: Promise<{ status?: string; q?: string; sort?: string }> }

export default async function AdminWorkspacesPage({ searchParams }: Params) {
  const admin = createAdminClient()
  const sp = await searchParams
  const statusFilter = sp.status ?? 'all'
  const q = (sp.q ?? '').trim().toLowerCase()
  const sort = sp.sort ?? 'active'

  const [{ data: wsData }, { data: cocktailsData }, { data: membershipsData }, { data: usersData }] =
    await Promise.all([
      admin
        .from('workspaces')
        .select('id, slug, name, subscription_status, trial_ends_at, created_at, stripe_customer_id')
        .order('created_at', { ascending: false }),
      admin.from('cocktails').select('id, workspace_id, updated_at').neq('status', 'archived'),
      admin.from('memberships').select('workspace_id, user_id').not('joined_at', 'is', null),
      admin.auth.admin.listUsers({ perPage: 500 }),
    ])

  const workspaces = (wsData ?? []) as WorkspaceRow[]
  const cocktails = (cocktailsData ?? []) as { workspace_id: string; updated_at: string | null }[]
  const memberships = (membershipsData ?? []) as { workspace_id: string; user_id: string }[]
  const authUsers = usersData.users

  // Counts per workspace
  const wsStats = new Map<
    string,
    { cocktails: number; members: number; lastActiveAt: string | null }
  >()
  for (const w of workspaces) wsStats.set(w.id, { cocktails: 0, members: 0, lastActiveAt: null })
  for (const c of cocktails) {
    const s = wsStats.get(c.workspace_id)
    if (!s) continue
    s.cocktails += 1
    if (c.updated_at && (!s.lastActiveAt || c.updated_at > s.lastActiveAt)) {
      s.lastActiveAt = c.updated_at
    }
  }
  for (const m of memberships) {
    const s = wsStats.get(m.workspace_id)
    if (s) s.members += 1
  }

  // Owner lookup: first membership per workspace with role='owner'
  const ownersByWs = new Map<string, { email: string | null; id: string }>()
  const ownerMemberships = (memberships as unknown as { workspace_id: string; user_id: string; role?: string }[])
  for (const w of workspaces) {
    const ownerMem = ownerMemberships.find(
      (m) => m.workspace_id === w.id && (m.role === 'owner' || !ownersByWs.has(w.id)),
    )
    if (ownerMem) {
      const u = authUsers.find((u) => u.id === ownerMem.user_id)
      ownersByWs.set(w.id, { email: u?.email ?? null, id: ownerMem.user_id })
    }
  }

  // Apply filters
  const filtered = workspaces
    .filter((w) => {
      if (statusFilter !== 'all' && w.subscription_status !== statusFilter) return false
      if (q === '') return true
      const owner = ownersByWs.get(w.id)
      return (
        w.name.toLowerCase().includes(q) ||
        w.slug.toLowerCase().includes(q) ||
        (owner?.email?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      if (sort === 'active') {
        const aT = wsStats.get(a.id)?.lastActiveAt ?? ''
        const bT = wsStats.get(b.id)?.lastActiveAt ?? ''
        return bT.localeCompare(aT)
      }
      if (sort === 'created') return b.created_at.localeCompare(a.created_at)
      if (sort === 'members') {
        return (wsStats.get(b.id)?.members ?? 0) - (wsStats.get(a.id)?.members ?? 0)
      }
      if (sort === 'cocktails') {
        return (wsStats.get(b.id)?.cocktails ?? 0) - (wsStats.get(a.id)?.cocktails ?? 0)
      }
      return 0
    })

  const counts = {
    all: workspaces.length,
    active: workspaces.filter((w) => w.subscription_status === 'active').length,
    trialing: workspaces.filter((w) => w.subscription_status === 'trialing').length,
    past_due: workspaces.filter((w) => w.subscription_status === 'past_due').length,
    canceled: workspaces.filter((w) => w.subscription_status === 'canceled').length,
  }

  const tabs: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'trialing', label: 'Trial', count: counts.trialing },
    { id: 'past_due', label: 'Past due', count: counts.past_due },
    { id: 'canceled', label: 'Cancelled', count: counts.canceled },
  ]

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {workspaces.length} total
          </div>
          <h1 className="op-title">Workspaces</h1>
          <p className="op-sub">
            Every tenant on the platform. Click a row for details, impersonation, and Stripe.
          </p>
        </div>
        <div className="row">
          <a href="/api/admin/export/workspaces.csv" className="op-btn">
            <OpIcon name="external" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Status tabs */}
      <div className="op-tabs">
        {tabs.map((t) => {
          const params = new URLSearchParams()
          if (t.id !== 'all') params.set('status', t.id)
          if (q) params.set('q', q)
          if (sort !== 'active') params.set('sort', sort)
          const href = params.toString() ? `/admin/workspaces?${params.toString()}` : '/admin/workspaces'
          return (
            <Link key={t.id} href={href} className="op-tab" data-active={statusFilter === t.id}>
              {t.label}
              <span className="count">{t.count}</span>
            </Link>
          )
        })}
      </div>

      <WorkspacesFilters defaultQuery={q} defaultSort={sort} resultCount={filtered.length} />

      <div className="op-card" style={{ padding: 0 }}>
        <div className="op-t-wrap">
          <table className="op-t">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Workspace</th>
                <th>Status</th>
                <th>Members</th>
                <th>Cocktails</th>
                <th>Last active</th>
                <th>Created</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="op-empty">
                    No workspaces match these filters.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  const s = wsStats.get(w.id)
                  const owner = ownersByWs.get(w.id)
                  return (
                    <tr key={w.id} style={{ position: 'relative' }}>
                      <td>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            background: wsColor(w.slug),
                            color: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                            fontFamily: 'Instrument Serif, Georgia, serif',
                            fontStyle: 'italic',
                            fontSize: 15,
                          }}
                        >
                          {wsGlyph(w.name)}
                        </div>
                      </td>
                      <td>
                        <Link href={`/admin/workspaces/${w.id}`} style={{ display: 'block', color: 'inherit' }}>
                          <div style={{ fontWeight: 500 }}>{w.name}</div>
                          <div className="mut mono" style={{ fontSize: 10.5 }}>
                            {owner?.email ?? 'no owner'} · {w.slug}.shakebase.co
                          </div>
                        </Link>
                      </td>
                      <td>
                        <span className={'op-chip ' + statusTone(w.subscription_status)}>
                          <span className="dot"></span>
                          {statusLabel(w.subscription_status)}
                        </span>
                      </td>
                      <td className="mono">{s?.members ?? 0}</td>
                      <td className="mono">{s?.cocktails ?? 0}</td>
                      <td className="mut mono nowrap" style={{ fontSize: 11.5 }}>
                        {timeAgo(s?.lastActiveAt)}
                      </td>
                      <td className="mut mono nowrap" style={{ fontSize: 11.5 }}>
                        {timeAgo(w.created_at)}
                      </td>
                      <td>
                        <Link
                          href={`/admin/workspaces/${w.id}`}
                          style={{ color: 'var(--op-ink-3)' }}
                        >
                          <OpIcon name="chevron" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
