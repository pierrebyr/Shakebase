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

  // Pull a window's worth of events + the preceding window (for anomaly
  // comparison) in parallel. The admin client bypasses RLS so we see
  // everything cross-tenant. Exclude impersonation from aggregates but
  // keep them in the timeline so ops can audit their own activity.
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

  // Totals — break total out by window (pre-filtered to `days` already)
  const totalEvents = events.length
  const activeUsers = new Set(events.map((e) => e.user_id).filter(Boolean)).size
  const activeWorkspaces = new Set(events.map((e) => e.workspace_id)).size

  const last24 = events.filter(
    (e) => Date.now() - new Date(e.occurred_at).getTime() < DAY_MS,
  ).length

  // Events per workspace (current window) + anomaly vs previous window
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
      const topKind =
        [...v.kinds.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      const prev = prevByWs.get(wsId) ?? 0
      const delta = prev > 0 ? (v.total - prev) / prev : null
      return { workspace: workspaces.get(wsId), id: wsId, total: v.total, topKind, delta }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)

  // Anomaly callout: active workspaces in current window whose search.query
  // count more than doubled vs previous window.
  type Spike = { workspace: WorkspaceMeta | undefined; id: string; current: number; previous: number }
  const spikes: Spike[] = []
  for (const [wsId, v] of byWs) {
    const currSearches = v.kinds.get(ACTIVITY_KINDS.SEARCH_QUERY) ?? 0
    if (currSearches < 10) continue
    const prevSearches = prevEvents.filter(
      (e) => e.workspace_id === wsId && e.kind === ACTIVITY_KINDS.SEARCH_QUERY,
    ).length
    if (prevSearches > 0 && currSearches / prevSearches >= 2) {
      spikes.push({ workspace: workspaces.get(wsId), id: wsId, current: currSearches, previous: prevSearches })
    }
  }
  spikes.sort((a, b) => b.current / Math.max(1, b.previous) - a.current / Math.max(1, a.previous))

  // Top cross-tenant search queries (counts only — per workspace attribution
  // deliberately hidden in the cross-tenant view for privacy).
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

  return (
    <div className="op-page">
      <header className="op-page-head">
        <div>
          <div className="op-kicker">Activity</div>
          <h1 className="op-title">Cross-workspace signals.</h1>
          <p className="op-sub">
            Read-only. Excludes admin impersonation from aggregates. Retention: 90 days rolling.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 7, 30].map((d) => (
            <Link
              key={d}
              href={d === 7 ? '/admin/activity' : `/admin/activity?days=${d}`}
              className={d === days ? 'op-btn op-btn-primary' : 'op-btn'}
              style={{ fontSize: 12 }}
            >
              Last {d}d
            </Link>
          ))}
        </div>
      </header>

      {/* Hero counts */}
      <section
        className="op-grid"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginTop: 14,
        }}
      >
        <StatCard kicker="Events" value={totalEvents.toLocaleString()} sub={`last ${days} d`} />
        <StatCard
          kicker="Last 24 h"
          value={last24.toLocaleString()}
          sub={`${Math.round((last24 / Math.max(1, totalEvents)) * 100)}% of window`}
        />
        <StatCard
          kicker="Active workspaces"
          value={activeWorkspaces.toLocaleString()}
          sub="wrote ≥1 event"
        />
        <StatCard
          kicker="Active users"
          value={activeUsers.toLocaleString()}
          sub="across all tenants"
        />
      </section>

      {/* Anomaly strip */}
      {spikes.length > 0 && (
        <section
          className="op-card"
          style={{
            marginTop: 18,
            background: 'var(--op-warn-bg, #fff7e6)',
            borderColor: 'var(--op-warn-line, #f3d588)',
            padding: 14,
          }}
        >
          <div
            className="op-kicker"
            style={{ color: 'var(--op-warn-ink, #8a6d1f)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <OpIcon name="audit" size={12} /> Search spikes
          </div>
          <div style={{ fontSize: 13, color: 'var(--op-ink-2)', marginTop: 4 }}>
            Workspaces whose search volume more than doubled vs the previous {days}-day window.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {spikes.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                href={`/admin/workspaces/${s.id}`}
                className="op-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 16,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#fff',
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 500 }}>{s.workspace?.name ?? s.id}</span>
                <span className="op-mono" style={{ color: 'var(--op-ink-3)' }}>
                  {s.previous} → {s.current}
                </span>
                <span className="op-mono" style={{ color: 'var(--op-accent)' }}>
                  {fmtPct(s.current / s.previous - 1)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top workspaces */}
      <section className="op-card" style={{ marginTop: 18, padding: 0 }}>
        <header
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--op-line-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="op-kicker">Workspaces</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>By activity ({days}d)</div>
          </div>
          <div className="op-mono" style={{ fontSize: 11, color: 'var(--op-ink-4)' }}>
            TOP {rows.length} · Δ VS PRIOR {days}D
          </div>
        </header>
        <table className="op-table">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Status</th>
              <th>Top event</th>
              <th style={{ textAlign: 'right' }}>Events</th>
              <th style={{ textAlign: 'right' }}>Δ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--op-ink-4)' }}>
                  No events logged in this window yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/workspaces/${r.id}`} style={{ fontWeight: 500 }}>
                    {r.workspace?.name ?? r.id}
                  </Link>
                  {r.workspace?.slug && (
                    <div
                      className="op-mono"
                      style={{ fontSize: 11, color: 'var(--op-ink-4)', marginTop: 2 }}
                    >
                      {r.workspace.slug}
                    </div>
                  )}
                </td>
                <td>
                  <span className="op-pill" style={{ fontSize: 11 }}>
                    {r.workspace?.subscription_status ?? '—'}
                  </span>
                </td>
                <td
                  className="op-mono"
                  style={{ fontSize: 11.5, color: 'var(--op-ink-3)' }}
                >
                  {r.topKind ?? '—'}
                </td>
                <td className="op-mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {r.total.toLocaleString()}
                </td>
                <td
                  className="op-mono"
                  style={{
                    textAlign: 'right',
                    color:
                      r.delta == null
                        ? 'var(--op-ink-4)'
                        : r.delta >= 0
                        ? 'var(--op-accent)'
                        : 'var(--op-ink-2)',
                  }}
                >
                  {r.delta == null ? 'new' : fmtPct(r.delta)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link
                    href={`/admin/impersonate/start?workspace_id=${r.id}`}
                    className="op-btn"
                    style={{ fontSize: 11 }}
                  >
                    Impersonate
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Top searches cross-tenant */}
      <section className="op-card" style={{ marginTop: 18, padding: 0 }}>
        <header
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--op-line-2)',
          }}
        >
          <div className="op-kicker">Searches</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Top queries (all tenants)</div>
          <div style={{ fontSize: 12, color: 'var(--op-ink-4)', marginTop: 4 }}>
            Counts only — workspace attribution intentionally hidden. Use the per-workspace
            activity view for detail.
          </div>
        </header>
        <table className="op-table">
          <thead>
            <tr>
              <th>Query</th>
              <th style={{ textAlign: 'right' }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {topSearches.length === 0 && (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', padding: 24, color: 'var(--op-ink-4)' }}>
                  No searches in this window.
                </td>
              </tr>
            )}
            {topSearches.map((s) => (
              <tr key={s.q}>
                <td style={{ fontStyle: 'italic' }}>&ldquo;{s.q}&rdquo;</td>
                <td
                  className="op-mono"
                  style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                >
                  {s.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function StatCard({
  kicker,
  value,
  sub,
}: {
  kicker: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="op-card" style={{ padding: 16 }}>
      <div className="op-kicker">{kicker}</div>
      <div style={{ fontSize: 28, fontWeight: 600, marginTop: 6, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--op-ink-4)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
