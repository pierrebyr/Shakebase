import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import {
  daysUntil,
  fmtDate,
  timeAgo,
  statusTone,
  statusLabel,
  wsColor,
  wsGlyph,
} from '@/lib/admin/format'

type WorkspaceRow = {
  id: string
  slug: string
  name: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
}

type CocktailCountRow = {
  workspace_id: string
  id: string
  updated_at: string | null
}

const PLAN_PRICE_CENTS = 34900 // Studio only for now

export default async function AdminOverviewPage() {
  const admin = createAdminClient()

  const [
    { data: wsData },
    { data: cocktailsData },
    { count: creatorCount },
    { count: productCount },
    { data: auditData },
  ] = await Promise.all([
    admin
      .from('workspaces')
      .select('id, slug, name, subscription_status, trial_ends_at, created_at')
      .neq('subscription_status', 'canceled')
      .order('created_at', { ascending: false }),
    admin.from('cocktails').select('id, workspace_id, updated_at').neq('status', 'archived'),
    admin.from('creators').select('id', { count: 'exact', head: true }),
    admin.from('global_products').select('id', { count: 'exact', head: true }),
    admin
      .from('audit_events')
      .select('id, at, actor_kind, actor_email, action, target_label')
      .order('at', { ascending: false })
      .limit(7),
  ])
  const recentAudit = ((auditData ?? []) as unknown as {
    id: string
    at: string
    actor_kind: string
    actor_email: string | null
    action: string
    target_label: string | null
  }[])

  const workspaces = (wsData ?? []) as WorkspaceRow[]
  const cocktails = (cocktailsData ?? []) as CocktailCountRow[]

  const active = workspaces.filter((w) => w.subscription_status === 'active')
  const trialing = workspaces.filter((w) => w.subscription_status === 'trialing')
  const pastDue = workspaces.filter((w) => w.subscription_status === 'past_due')
  const mrrCents = active.length * PLAN_PRICE_CENTS

  // Cocktails per workspace
  const byWs = new Map<string, { count: number; lastUpdate: number }>()
  for (const c of cocktails) {
    const prev = byWs.get(c.workspace_id) ?? { count: 0, lastUpdate: 0 }
    const ts = c.updated_at ? new Date(c.updated_at).getTime() : 0
    byWs.set(c.workspace_id, {
      count: prev.count + 1,
      lastUpdate: Math.max(prev.lastUpdate, ts),
    })
  }
  const top = [...workspaces]
    .map((w) => ({ ...w, count: byWs.get(w.id)?.count ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Trials ending soon (<= 7d)
  const hotTrials = trialing
    .map((w) => ({ ...w, daysLeft: daysUntil(w.trial_ends_at) ?? 999 }))
    .filter((w) => w.daysLeft <= 7 && w.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
            {new Date().getFullYear()}
          </div>
          <h1 className="op-title">
            Everything, <span className="it">at a glance.</span>
          </h1>
          <p className="op-sub">
            Growth, health, and what needs your attention today. Click any number to drill in.
          </p>
        </div>
        <div className="row">
          <select className="op-input op-select">
            <option>Last 12 weeks</option>
            <option>Last 30 days</option>
            <option>Quarter to date</option>
          </select>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noreferrer"
            className="op-btn"
          >
            <OpIcon name="external" />
            Stripe dashboard
          </a>
        </div>
      </div>

      {/* Stats strip */}
      <div className="op-stats" style={{ marginBottom: 18 }}>
        <div className="op-stat">
          <div className="k">MRR</div>
          <div className="v">
            ${(mrrCents / 100).toLocaleString()}
            <small>/mo</small>
          </div>
          <div className="d flat">
            <span className="op-chip ok" style={{ fontSize: 9.5 }}>
              {active.length} paying
            </span>
          </div>
        </div>
        <div className="op-stat">
          <div className="k">Signups / week</div>
          <div className="v">
            {
              workspaces.filter(
                (w) => Date.now() - new Date(w.created_at).getTime() < 7 * 86400000,
              ).length
            }
          </div>
          <div className="d flat">
            <OpIcon name="calendar" size={11} />
            Last 7 days
          </div>
        </div>
        <div className="op-stat">
          <div className="k">Trial → paid</div>
          <div className="v">—</div>
          <div className="d flat">Needs 30d of data</div>
        </div>
        <div className="op-stat">
          <div className="k">Monthly churn</div>
          <div className="v">—</div>
          <div className="d flat">Needs 30d of data</div>
        </div>
        <div className="op-stat">
          <div className="k">Active workspaces</div>
          <div className="v">{workspaces.length}</div>
          <div className="d flat" style={{ gap: 6 }}>
            <span className="op-chip ok" style={{ fontSize: 9.5 }}>
              {active.length} active
            </span>
            <span className="op-chip warn" style={{ fontSize: 9.5 }}>
              {trialing.length} trial
            </span>
          </div>
        </div>
      </div>

      {/* Needs attention + Recent activity */}
      <div className="op-grid-2" style={{ marginBottom: 18 }}>
        <div className="op-card">
          <div className="op-card-head">
            <h3>Needs your attention</h3>
            <span className="op-chip crit">
              <span className="dot"></span>
              {pastDue.length + hotTrials.length} items
            </span>
          </div>
          <div style={{ padding: '6px 0' }}>
            {pastDue.length === 0 && hotTrials.length === 0 && (
              <div className="op-empty" style={{ padding: '40px 24px' }}>
                No fires. Nice.
              </div>
            )}
            {pastDue.map((w) => (
              <AttentionRow
                key={w.id}
                href={`/admin/workspaces/${w.id}`}
                icon="warning"
                tone="crit"
                title="Past-due renewal"
                body={`${w.name} · payment needs resolving`}
                action="Resolve"
              />
            ))}
            {hotTrials.slice(0, 4).map((w) => (
              <AttentionRow
                key={w.id}
                href={`/admin/workspaces/${w.id}`}
                icon="sparkles"
                tone="warn"
                title={`Trial ending in ${w.daysLeft}d`}
                body={`${w.name} · ${byWs.get(w.id)?.count ?? 0} cocktails built so far`}
                action="Reach out"
              />
            ))}
          </div>
        </div>

        <div className="op-card">
          <div className="op-card-head">
            <h3>Recent activity</h3>
            <Link href="/admin/audit" className="op-btn ghost sm">
              Full log →
            </Link>
          </div>
          <div style={{ padding: 0 }}>
            {recentAudit.length === 0 ? (
              <div className="op-empty">
                No events yet. First admin action will populate this feed.
              </div>
            ) : (
              recentAudit.map((e) => {
                const tone =
                  e.actor_kind === 'impersonation'
                    ? 'warn'
                    : e.actor_kind === 'admin'
                      ? 'accent'
                      : e.actor_kind === 'system'
                        ? 'info'
                        : ''
                return (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 18px',
                      borderBottom: '1px solid var(--op-line-2)',
                    }}
                  >
                    <span className={'op-chip ' + tone} style={{ fontSize: 9.5, flexShrink: 0 }}>
                      {e.actor_kind === 'impersonation'
                        ? 'IMPERS'
                        : e.actor_kind.toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5 }}>
                        <b style={{ fontWeight: 500 }}>{e.actor_email ?? '—'}</b>
                        <span className="mut mono" style={{ fontSize: 11, margin: '0 8px' }}>
                          {e.action}
                        </span>
                        {e.target_label && <span>{e.target_label}</span>}
                      </div>
                    </div>
                    <span
                      className="mut mono nowrap"
                      style={{ fontSize: 10.5, flexShrink: 0 }}
                    >
                      {timeAgo(e.at)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Plan mix + Top workspaces */}
      <div className="op-grid-2">
        <div className="op-card">
          <div className="op-card-head">
            <h3>Plan mix</h3>
            <span className="mut mono" style={{ fontSize: 11 }}>
              ${(mrrCents / 100).toLocaleString()} MRR
            </span>
          </div>
          <div className="op-card-body">
            <PlanRow name="Studio" count={active.length} mrrCents={active.length * PLAN_PRICE_CENTS} />
            <PlanRow name="Trial (unpaid)" count={trialing.length} mrrCents={0} tone="warn" />
            <div
              className="mut"
              style={{ fontSize: 12, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--op-line-2)' }}
            >
              Studio is the only plan today at ${(PLAN_PRICE_CENTS / 100).toFixed(0)}/mo.
              Solo and Pro tiers are on the roadmap.
            </div>
          </div>
        </div>

        <div className="op-card">
          <div className="op-card-head">
            <h3>Top workspaces by library size</h3>
            <span className="mut mono" style={{ fontSize: 11 }}>
              All time
            </span>
          </div>
          <div style={{ padding: 0 }}>
            {top.length === 0 ? (
              <div className="op-empty">No workspaces yet.</div>
            ) : (
              top.map((w) => (
                <Link
                  key={w.id}
                  href={`/admin/workspaces/${w.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--op-line-2)',
                    color: 'inherit',
                  }}
                >
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ fontWeight: 500 }}>{w.name}</b>
                      <span className={'op-chip ' + statusTone(w.subscription_status)} style={{ fontSize: 9.5 }}>
                        {statusLabel(w.subscription_status)}
                      </span>
                    </div>
                    <div className="mut mono" style={{ fontSize: 10.5, marginTop: 2 }}>
                      {w.count} cocktails · last update{' '}
                      {byWs.get(w.id)?.lastUpdate
                        ? timeAgo(new Date(byWs.get(w.id)!.lastUpdate).toISOString())
                        : '—'}
                    </div>
                  </div>
                  <OpIcon name="chevron" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Totals footer */}
      <div className="op-stats" style={{ marginTop: 22, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="op-stat">
          <div className="k">Total cocktails</div>
          <div className="v">{cocktails.length.toLocaleString()}</div>
        </div>
        <div className="op-stat">
          <div className="k">Total creators</div>
          <div className="v">{(creatorCount ?? 0).toLocaleString()}</div>
        </div>
        <div className="op-stat">
          <div className="k">Global products</div>
          <div className="v">{(productCount ?? 0).toLocaleString()}</div>
        </div>
        <div className="op-stat">
          <div className="k">Oldest workspace</div>
          <div className="v" style={{ fontSize: 20 }}>
            {workspaces.length > 0
              ? fmtDate(workspaces[workspaces.length - 1]!.created_at)
              : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

function AttentionRow({
  href,
  icon,
  tone,
  title,
  body,
  action,
}: {
  href: string
  icon: Parameters<typeof OpIcon>[0]['name']
  tone: 'crit' | 'warn' | 'info'
  title: string
  body: string
  action: string
}) {
  const bg =
    tone === 'crit'
      ? 'rgba(224,114,100,0.1)'
      : tone === 'warn'
        ? 'rgba(226,179,90,0.12)'
        : 'rgba(127,174,207,0.12)'
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '14px 18px',
        borderBottom: '1px solid var(--op-line-2)',
        color: 'inherit',
      }}
    >
      <div
        className={tone}
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          display: 'grid',
          placeItems: 'center',
          background: bg,
        }}
      >
        <OpIcon name={icon} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div className="mut" style={{ fontSize: 12, marginTop: 2 }}>
          {body}
        </div>
      </div>
      <span className="op-btn sm">
        {action}
        <OpIcon name="chevron" />
      </span>
    </Link>
  )
}

function PlanRow({
  name,
  count,
  mrrCents,
  tone,
}: {
  name: string
  count: number
  mrrCents: number
  tone?: 'ok' | 'warn' | 'crit'
}) {
  const fill = Math.min(100, (count / Math.max(1, count)) * 100)
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <b>{name}</b>
          <span className="mut mono" style={{ fontSize: 11 }}>
            {count} workspace{count === 1 ? '' : 's'}
          </span>
        </div>
        <span className="mono" style={{ fontSize: 12, color: 'var(--op-ink-1)' }}>
          ${(mrrCents / 100).toLocaleString()}/mo
        </span>
      </div>
      <div className="op-meter">
        <i className={tone ?? ''} style={{ width: count > 0 ? fill + '%' : '0%' }} />
      </div>
    </div>
  )
}
