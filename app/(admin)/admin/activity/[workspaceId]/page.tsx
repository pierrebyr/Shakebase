import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import { ACTIVITY_KINDS } from '@/lib/activity/kinds'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ days?: string; kind?: string }>
}

type EventRow = {
  id: string
  user_id: string | null
  occurred_at: string
  kind: string
  target_type: string | null
  target_id: string | null
  target_label: string | null
  metadata: Record<string, unknown> | null
  is_admin_impersonation: boolean
}

const DAY_MS = 86_400_000

function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY_MS).toISOString()
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

const KIND_LABEL: Record<string, string> = {
  [ACTIVITY_KINDS.COCKTAIL_VIEW]: 'viewed cocktail',
  [ACTIVITY_KINDS.PRODUCT_VIEW]: 'viewed product',
  [ACTIVITY_KINDS.CREATOR_VIEW]: 'viewed creator',
  [ACTIVITY_KINDS.PAGE_VIEW]: 'visited',
  [ACTIVITY_KINDS.SEARCH_QUERY]: 'searched',
  [ACTIVITY_KINDS.COCKTAIL_FAVORITE]: 'favorited',
  [ACTIVITY_KINDS.COCKTAIL_UNFAVORITE]: 'unfavorited',
  [ACTIVITY_KINDS.COCKTAIL_CREATE]: 'created cocktail',
  [ACTIVITY_KINDS.COCKTAIL_EDIT]: 'edited cocktail',
  [ACTIVITY_KINDS.COCKTAIL_DELETE]: 'deleted cocktail',
}

const KIND_FILTERS: Array<{ id: string; label: string; matches: (k: string) => boolean }> = [
  { id: 'all', label: 'All', matches: () => true },
  { id: 'views', label: 'Views', matches: (k) => k.endsWith('.view') },
  { id: 'searches', label: 'Searches', matches: (k) => k === ACTIVITY_KINDS.SEARCH_QUERY },
  {
    id: 'mutations',
    label: 'Mutations',
    matches: (k) =>
      k === ACTIVITY_KINDS.COCKTAIL_CREATE ||
      k === ACTIVITY_KINDS.COCKTAIL_EDIT ||
      k === ACTIVITY_KINDS.COCKTAIL_DELETE ||
      k === ACTIVITY_KINDS.COCKTAIL_FAVORITE ||
      k === ACTIVITY_KINDS.COCKTAIL_UNFAVORITE,
  },
]

export default async function AdminActivityWorkspacePage({ params, searchParams }: Props) {
  const { workspaceId } = await params
  const { days: daysParam, kind: kindParam } = await searchParams
  const days = daysParam === '1' || daysParam === '30' || daysParam === '90' ? Number(daysParam) : 7
  const kindFilter = KIND_FILTERS.find((f) => f.id === kindParam) ?? KIND_FILTERS[0]!

  const admin = createAdminClient()
  const { data: wsData } = await admin
    .from('workspaces')
    .select('id, name, slug, subscription_status, trial_ends_at')
    .eq('id', workspaceId)
    .maybeSingle<{
      id: string
      name: string
      slug: string
      subscription_status: string
      trial_ends_at: string | null
    }>()
  if (!wsData) notFound()
  const workspace = wsData

  // Fetch everything we need in parallel: events, profiles for attribution,
  // members for the "active users" breakdown.
  const [{ data: eventsData }, { data: membershipsData }] = await Promise.all([
    admin
      .from('activity_events')
      .select(
        'id, user_id, occurred_at, kind, target_type, target_id, target_label, metadata, is_admin_impersonation',
      )
      .eq('workspace_id', workspace.id)
      .gte('occurred_at', daysAgo(days))
      .order('occurred_at', { ascending: false })
      .limit(5_000),
    admin
      .from('memberships')
      .select('user_id, role')
      .eq('workspace_id', workspace.id)
      .not('joined_at', 'is', null),
  ])

  const events = (eventsData ?? []) as EventRow[]
  const memberships = (membershipsData ?? []) as { user_id: string; role: string }[]

  const filtered = events.filter((e) => kindFilter.matches(e.kind))

  // Exclude impersonation from aggregates; keep them in the timeline.
  const nonImpersonation = events.filter((e) => !e.is_admin_impersonation)
  const filteredVisible = filtered.slice(0, 200)

  // Hero stats
  const totalEvents = nonImpersonation.length
  const activeUsers = new Set(nonImpersonation.map((e) => e.user_id).filter(Boolean)).size
  const impersonationCount = events.length - nonImpersonation.length
  const cocktailViews = nonImpersonation.filter((e) => e.kind === ACTIVITY_KINDS.COCKTAIL_VIEW).length
  const searchCount = nonImpersonation.filter((e) => e.kind === ACTIVITY_KINDS.SEARCH_QUERY).length

  // Top cocktails viewed
  const cocktailCounts = new Map<string, { label: string; views: number }>()
  for (const e of nonImpersonation) {
    if (e.kind !== ACTIVITY_KINDS.COCKTAIL_VIEW || !e.target_id) continue
    const hit = cocktailCounts.get(e.target_id)
    if (hit) hit.views += 1
    else cocktailCounts.set(e.target_id, { label: e.target_label ?? '—', views: 1 })
  }
  const topCocktails = [...cocktailCounts.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  // Top searches (same workspace only — cross-tenant view is elsewhere)
  const searchCounts = new Map<string, { count: number; zero: number }>()
  for (const e of nonImpersonation) {
    if (e.kind !== ACTIVITY_KINDS.SEARCH_QUERY) continue
    const q = String(e.metadata?.q ?? '').trim().toLowerCase()
    if (q.length < 2) continue
    const resultCount = Number(e.metadata?.result_count ?? 0)
    const hit = searchCounts.get(q)
    if (hit) {
      hit.count += 1
      if (resultCount === 0) hit.zero += 1
    } else {
      searchCounts.set(q, { count: 1, zero: resultCount === 0 ? 1 : 0 })
    }
  }
  const topSearches = [...searchCounts.entries()]
    .map(([q, v]) => ({ q, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Active members
  const eventsByUser = new Map<string, number>()
  for (const e of nonImpersonation) {
    if (!e.user_id) continue
    eventsByUser.set(e.user_id, (eventsByUser.get(e.user_id) ?? 0) + 1)
  }
  const memberUserIds = Array.from(
    new Set([
      ...memberships.map((m) => m.user_id),
      ...Array.from(eventsByUser.keys()),
      ...events.map((e) => e.user_id).filter((u): u is string => typeof u === 'string'),
    ]),
  )
  const profiles = new Map<string, { name: string; email: string | null }>()
  if (memberUserIds.length > 0) {
    const { data: profData } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', memberUserIds)
    for (const p of (profData ?? []) as { id: string; full_name: string | null }[]) {
      profiles.set(p.id, { name: p.full_name ?? 'Unknown', email: null })
    }
  }
  const activeMembers = [...eventsByUser.entries()]
    .map(([userId, count]) => ({
      userId,
      count,
      name: profiles.get(userId)?.name ?? 'Unknown',
      role: memberships.find((m) => m.user_id === userId)?.role ?? '—',
    }))
    .sort((a, b) => b.count - a.count)

  const statusTone =
    workspace.subscription_status === 'active'
      ? 'ok'
      : workspace.subscription_status === 'gifted'
        ? 'accent'
        : workspace.subscription_status === 'trialing'
          ? 'info'
          : workspace.subscription_status === 'past_due'
            ? 'crit'
            : 'warn'

  const windowLabel = days === 1 ? '24 hours' : `${days} days`

  function buildHref(patch: Partial<{ days: number; kind: string }>): string {
    const p = new URLSearchParams()
    const d = patch.days ?? days
    const k = patch.kind ?? kindFilter.id
    if (d !== 7) p.set('days', String(d))
    if (k !== 'all') p.set('kind', k)
    const qs = p.toString()
    return qs ? `/admin/activity/${workspace.id}?${qs}` : `/admin/activity/${workspace.id}`
  }

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            <Link href="/admin/activity" style={{ color: 'var(--op-ink-3)' }}>
              ← All workspaces
            </Link>
          </div>
          <h1 className="op-title">
            {workspace.name} <span className="it">activity.</span>
          </h1>
          <p className="op-sub">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--op-ink-4)',
                letterSpacing: '0.04em',
              }}
            >
              {workspace.slug}
            </span>{' '}
            · <span className={`op-chip ${statusTone}`}>{workspace.subscription_status}</span> ·
            Last {windowLabel}. Impersonation tagged in timeline but excluded from stats.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link
            href={`/admin/workspaces/${workspace.id}`}
            className="op-btn"
            style={{ fontSize: 12 }}
          >
            <OpIcon name="workspaces" size={12} />
            Workspace admin
          </Link>
          <Link
            href={`/api/impersonate/start?workspace_id=${workspace.id}`}
            className="op-btn primary"
            style={{ fontSize: 12 }}
          >
            <OpIcon name="eye" size={12} />
            Impersonate
          </Link>
        </div>
      </div>

      {/* Window selector */}
      <div className="op-tabs" style={{ marginBottom: 18 }}>
        {[1, 7, 30, 90].map((d) => (
          <Link
            key={d}
            href={buildHref({ days: d })}
            className="op-tab"
            data-active={d === days}
          >
            Last {d}d
          </Link>
        ))}
      </div>

      {/* Hero stats */}
      <div className="op-stats" style={{ marginBottom: 18 }}>
        <div className="op-stat">
          <div className="k">Events</div>
          <div className="v">{totalEvents.toLocaleString()}</div>
          <div className="d flat">last {windowLabel}</div>
        </div>
        <div className="op-stat">
          <div className="k">Active users</div>
          <div className="v">{activeUsers.toLocaleString()}</div>
          <div className="d flat">of {memberships.length} members</div>
        </div>
        <div className="op-stat">
          <div className="k">Cocktail views</div>
          <div className="v">{cocktailViews.toLocaleString()}</div>
          <div className="d flat">{cocktailCounts.size} unique</div>
        </div>
        <div className="op-stat">
          <div className="k">Searches</div>
          <div className="v">{searchCount.toLocaleString()}</div>
          <div className="d flat">{topSearches.length} unique queries</div>
        </div>
        <div className="op-stat">
          <div className="k">Impersonation</div>
          <div className="v">{impersonationCount.toLocaleString()}</div>
          <div className="d flat">admin visits (excluded)</div>
        </div>
      </div>

      {/* Active members */}
      <div className="op-card" style={{ padding: 0, marginBottom: 18 }}>
        <div className="op-card-head">
          <h3>Who&rsquo;s active</h3>
          <span className="eyebrow" style={{ fontSize: 9.5, color: 'var(--op-ink-4)' }}>
            By event count
          </span>
        </div>
        <div className="op-t-wrap">
          <table className="op-t">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th style={{ textAlign: 'right', width: 120 }}>Events</th>
              </tr>
            </thead>
            <tbody>
              {activeMembers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="op-empty">
                    No member activity in this window.
                  </td>
                </tr>
              ) : (
                activeMembers.map((m) => (
                  <tr key={m.userId}>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--op-ink-3)',
                      }}
                    >
                      {m.role}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {m.count.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top cocktails + top searches side by side */}
      <div className="op-grid-2" style={{ marginBottom: 18 }}>
        <div className="op-card" style={{ padding: 0 }}>
          <div className="op-card-head">
            <h3>Top cocktails</h3>
          </div>
          <div className="op-t-wrap">
            <table className="op-t">
              <thead>
                <tr>
                  <th>Cocktail</th>
                  <th style={{ textAlign: 'right', width: 80 }}>Views</th>
                </tr>
              </thead>
              <tbody>
                {topCocktails.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="op-empty">
                      No cocktail views in this window.
                    </td>
                  </tr>
                ) : (
                  topCocktails.map((c) => (
                    <tr key={c.id}>
                      <td>{c.label}</td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {c.views}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="op-card" style={{ padding: 0 }}>
          <div className="op-card-head">
            <h3>Top searches</h3>
          </div>
          <div className="op-t-wrap">
            <table className="op-t">
              <thead>
                <tr>
                  <th>Query</th>
                  <th style={{ textAlign: 'right', width: 80 }}>Count</th>
                  <th style={{ textAlign: 'right', width: 80 }}>Zero</th>
                </tr>
              </thead>
              <tbody>
                {topSearches.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="op-empty">
                      No searches in this window.
                    </td>
                  </tr>
                ) : (
                  topSearches.map((s) => (
                    <tr key={s.q}>
                      <td style={{ fontStyle: 'italic' }}>&ldquo;{s.q}&rdquo;</td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {s.count}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          color: s.zero > 0 ? 'var(--op-crit)' : 'var(--op-ink-4)',
                        }}
                      >
                        {s.zero || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="op-card" style={{ padding: 0 }}>
        <div className="op-card-head">
          <h3>Timeline</h3>
          <span className="eyebrow" style={{ fontSize: 9.5, color: 'var(--op-ink-4)' }}>
            {filtered.length} matching event{filtered.length === 1 ? '' : 's'}
            {filteredVisible.length < filtered.length && ` · showing ${filteredVisible.length}`}
          </span>
        </div>
        <div className="op-tabs" style={{ margin: '0 18px 8px' }}>
          {KIND_FILTERS.map((f) => (
            <Link
              key={f.id}
              href={buildHref({ kind: f.id })}
              className="op-tab"
              data-active={f.id === kindFilter.id}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="op-t-wrap">
          <table className="op-t">
            <thead>
              <tr>
                <th style={{ width: 120 }}>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Target</th>
                <th style={{ width: 110 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredVisible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="op-empty">
                    No events match this filter.
                  </td>
                </tr>
              ) : (
                filteredVisible.map((e) => {
                  const who = e.user_id ? profiles.get(e.user_id)?.name ?? 'Unknown' : 'Removed user'
                  const verb = KIND_LABEL[e.kind] ?? e.kind
                  const target =
                    e.target_label ??
                    (e.kind === ACTIVITY_KINDS.SEARCH_QUERY
                      ? `"${String(e.metadata?.q ?? '')}"`
                      : '—')
                  return (
                    <tr key={e.id}>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--op-ink-3)',
                        }}
                      >
                        {relTime(e.occurred_at)}
                      </td>
                      <td style={{ fontWeight: 500 }}>{who}</td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--op-ink-3)',
                        }}
                      >
                        {verb}
                      </td>
                      <td style={{ fontStyle: e.kind === ACTIVITY_KINDS.SEARCH_QUERY ? 'italic' : 'normal' }}>
                        {target}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {e.is_admin_impersonation && (
                          <span className="op-chip accent" style={{ fontSize: 10 }}>
                            admin
                          </span>
                        )}
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
