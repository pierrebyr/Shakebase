import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import { ACTIVITY_KINDS } from '@/lib/activity/kinds'

export const dynamic = 'force-dynamic'

type EventRow = {
  id: string
  workspace_id: string
  user_id: string | null
  occurred_at: string
  kind: string
  metadata: Record<string, unknown> | null
  is_admin_impersonation: boolean
}

type WorkspaceMeta = {
  id: string
  name: string
  slug: string
  subscription_status: string
}

const DAY_MS = 86_400_000

function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY_MS).toISOString()
}

function fmtPct(v: number): string {
  if (!Number.isFinite(v)) return '—'
  const rounded = Math.round(v * 100)
  if (rounded === 0) return '0%'
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

type SearchParams = { days?: string }

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { days: daysParam } = await searchParams
  const days = daysParam === '1' || daysParam === '30' ? Number(daysParam) : 7

  const admin = createAdminClient()

  // Pull current + preceding window for delta. Admin client bypasses RLS
  // so we see everything cross-tenant. Impersonation excluded from
  // aggregates so ops don't pollute their own stats.
  const [{ data: rowsData }, { data: prevData }, { data: wsData }] = await Promise.all([
    admin
      .from('activity_events')
      .select('id, workspace_id, user_id, occurred_at, kind, metadata, is_admin_impersonation')
      .gte('occurred_at', daysAgo(days))
      .eq('is_admin_impersonation', false)
      .order('occurred_at', { ascending: false })
      .limit(20_000),
    admin
      .from('activity_events')
      .select('workspace_id, kind')
      .gte('occurred_at', daysAgo(days * 2))
      .lt('occurred_at', daysAgo(days))
      .eq('is_admin_impersonation', false)
      .limit(20_000),
    admin.from('workspaces').select('id, name, slug, subscription_status'),
  ])

  const events = (rowsData ?? []) as EventRow[]
  const prevEvents = (prevData ?? []) as { workspace_id: string; kind: string }[]
  const workspaces = new Map<string, WorkspaceMeta>()
  for (const w of (wsData ?? []) as WorkspaceMeta[]) {
    workspaces.set(w.id, w)
  }

  const totalEvents = events.length
  const activeUsers = new Set(events.map((e) => e.user_id).filter(Boolean)).size
  const activeWorkspaces = new Set(events.map((e) => e.workspace_id)).size
  const last24 = events.filter((e) => Date.now() - new Date(e.occurred_at).getTime() < DAY_MS).length

  // Events per workspace + anomaly vs previous window
  const byWs = new Map<string, { total: number; kinds: Map<string, number> }>()
  for (const e of events) {
    const hit = byWs.get(e.workspace_id)
    if (hit) {
      hit.total += 1
      hit.kinds.set(e.kind, (hit.kinds.get(e.kind) ?? 0) + 1)
    } else {
      byWs.set(e.workspace_id, { total: 1, kinds: new Map([[e.kind, 1]]) })
    }
  }
  const prevByWs = new Map<string, number>()
  for (const e of prevEvents) {
    prevByWs.set(e.workspace_id, (prevByWs.get(e.workspace_id) ?? 0) + 1)
  }

  type Row = {
    workspace: WorkspaceMeta | undefined
    id: string
    total: number
    topKind: string | null
    delta: number | null
  }
  const rows: Row[] = [...byWs.entries()]
    .map(([wsId, v]) => {
      const topKind = [...v.kinds.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      const prev = prevByWs.get(wsId) ?? 0
      const delta = prev > 0 ? (v.total - prev) / prev : null
      return { workspace: workspaces.get(wsId), id: wsId, total: v.total, topKind, delta }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)

  // Anomaly callout — active workspaces whose search volume more than
  // doubled vs the previous window (>= 10 queries threshold filters noise).
  type Spike = {
    workspace: WorkspaceMeta | undefined
    id: string
    current: number
    previous: number
  }
  const spikes: Spike[] = []
  for (const [wsId, v] of byWs) {
    const currSearches = v.kinds.get(ACTIVITY_KINDS.SEARCH_QUERY) ?? 0
    if (currSearches < 10) continue
    const prevSearches = prevEvents.filter(
      (e) => e.workspace_id === wsId && e.kind === ACTIVITY_KINDS.SEARCH_QUERY,
    ).length
    if (prevSearches > 0 && currSearches / prevSearches >= 2) {
      spikes.push({
        workspace: workspaces.get(wsId),
        id: wsId,
        current: currSearches,
        previous: prevSearches,
      })
    }
  }
  spikes.sort((a, b) => b.current / Math.max(1, b.previous) - a.current / Math.max(1, a.previous))

  // Top cross-tenant queries — counts only, attribution hidden for privacy.
  const searchCounts = new Map<string, number>()
  for (const e of events) {
    if (e.kind !== ACTIVITY_KINDS.SEARCH_QUERY) continue
    const q = String(e.metadata?.q ?? '').trim().toLowerCase()
    if (q.length < 2) continue
    searchCounts.set(q, (searchCounts.get(q) ?? 0) + 1)
  }
  const topSearches = [...searchCounts.entries()]
    .map(([q, count]) => ({ q, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const windowLabel = days === 1 ? '24 hours' : `${days} days`

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Activity · cross-workspace
          </div>
          <h1 className="op-title">
            Who&rsquo;s <span className="it">doing what.</span>
          </h1>
          <p className="op-sub">
            Read-only. Excludes admin impersonation from aggregates. Retention: 90 days
            rolling. Current window: last {windowLabel}.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {[1, 7, 30].map((d) => {
            const isActive = d === days
            const href = d === 7 ? '/admin/activity' : `/admin/activity?days=${d}`
            return (
              <Link
                key={d}
                href={href}
                className={isActive ? 'op-btn primary' : 'op-btn'}
                style={{ fontSize: 12 }}
              >
                Last {d}d
              </Link>
            )
          })}
        </div>
      </div>

      {/* Hero stats */}
      <div className="op-stats" style={{ marginBottom: 18 }}>
        <div className="op-stat">
          <div className="k">Events</div>
          <div className="v">{totalEvents.toLocaleString()}</div>
          <div className="d flat">last {windowLabel}</div>
        </div>
        <div className="op-stat">
          <div className="k">Last 24 h</div>
          <div className="v">{last24.toLocaleString()}</div>
          <div className="d flat">
            {Math.round((last24 / Math.max(1, totalEvents)) * 100)}% of window
          </div>
        </div>
        <div className="op-stat">
          <div className="k">Active workspaces</div>
          <div className="v">{activeWorkspaces.toLocaleString()}</div>
          <div className="d flat">wrote ≥1 event</div>
        </div>
        <div className="op-stat">
          <div className="k">Active users</div>
          <div className="v">{activeUsers.toLocaleString()}</div>
          <div className="d flat">across all tenants</div>
        </div>
        <div className="op-stat">
          <div className="k">Search queries</div>
          <div className="v">{topSearches.reduce((a, s) => a + s.count, 0).toLocaleString()}</div>
          <div className="d flat">{topSearches.length} unique</div>
        </div>
      </div>

      {/* Anomaly strip */}
      {spikes.length > 0 && (
        <div className="op-card" style={{ marginBottom: 18 }}>
          <div className="op-card-head">
            <h3>Search spikes</h3>
            <span className="op-chip warn">
              <span className="dot"></span>
              {spikes.length} workspace{spikes.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="op-card-body" style={{ padding: '0 18px 12px' }}>
            <p style={{ color: 'var(--op-ink-3)', fontSize: 12.5, margin: '0 0 12px' }}>
              Workspaces whose search volume more than doubled vs the previous {windowLabel}
              window (≥ 10 queries required).
            </p>
            {spikes.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                href={`/admin/workspaces/${s.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 16,
                  padding: '10px 0',
                  borderTop: '1px solid var(--op-line)',
                  fontSize: 13,
                  color: 'var(--op-ink-1)',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 500 }}>{s.workspace?.name ?? s.id}</span>
                <span
                  style={{ color: 'var(--op-ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}
                >
                  {s.previous} → {s.current}
                </span>
                <span className="op-chip warn" style={{ fontSize: 10 }}>
                  {fmtPct(s.current / s.previous - 1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top workspaces table */}
      <div className="op-card" style={{ padding: 0, marginBottom: 18 }}>
        <div className="op-card-head">
          <h3>Top workspaces by activity</h3>
          <span
            className="eyebrow"
            style={{ fontSize: 9.5, color: 'var(--op-ink-4)' }}
          >
            Top {rows.length} · Δ vs prior {days}d
          </span>
        </div>
        <div className="op-t-wrap">
          <table className="op-t">
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Status</th>
                <th>Top event</th>
                <th style={{ textAlign: 'right' }}>Events</th>
                <th style={{ textAlign: 'right' }}>Δ</th>
                <th style={{ width: 120, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="op-empty">
                    No events logged in this window yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const statusTone =
                    r.workspace?.subscription_status === 'active'
                      ? 'ok'
                      : r.workspace?.subscription_status === 'gifted'
                        ? 'accent'
                        : r.workspace?.subscription_status === 'trialing'
                          ? 'info'
                          : r.workspace?.subscription_status === 'past_due'
                            ? 'crit'
                            : 'warn'
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link
                          href={`/admin/workspaces/${r.id}`}
                          style={{ fontWeight: 500, color: 'var(--op-ink-1)' }}
                        >
                          {r.workspace?.name ?? r.id}
                        </Link>
                        {r.workspace?.slug && (
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10.5,
                              color: 'var(--op-ink-4)',
                              marginTop: 3,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {r.workspace.slug}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`op-chip ${statusTone}`} style={{ fontSize: 10.5 }}>
                          {r.workspace?.subscription_status ?? '—'}
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11.5,
                          color: 'var(--op-ink-3)',
                        }}
                      >
                        {r.topKind ?? '—'}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {r.total.toLocaleString()}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          color:
                            r.delta == null
                              ? 'var(--op-ink-4)'
                              : r.delta >= 0
                                ? 'var(--op-ok)'
                                : 'var(--op-ink-3)',
                        }}
                      >
                        {r.delta == null ? 'new' : fmtPct(r.delta)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/admin/workspaces/${r.id}`}
                          className="op-btn sm ghost"
                          style={{ fontSize: 11 }}
                        >
                          View
                          <OpIcon name="chevron" size={10} />
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

      {/* Top searches cross-tenant */}
      <div className="op-card" style={{ padding: 0 }}>
        <div className="op-card-head">
          <h3>Top queries · all tenants</h3>
          <span
            className="eyebrow"
            style={{ fontSize: 9.5, color: 'var(--op-ink-4)' }}
          >
            Attribution hidden
          </span>
        </div>
        <div className="op-card-body" style={{ padding: '0 18px 6px' }}>
          <p style={{ color: 'var(--op-ink-3)', fontSize: 12, margin: '0 0 12px' }}>
            Counts only — workspace attribution intentionally hidden here. Drill into a
            single workspace for per-query detail.
          </p>
        </div>
        <div className="op-t-wrap">
          <table className="op-t">
            <thead>
              <tr>
                <th>Query</th>
                <th style={{ textAlign: 'right', width: 120 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {topSearches.length === 0 ? (
                <tr>
                  <td colSpan={2} className="op-empty">
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
                      {s.count.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
