import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import { daysUntil, fmtDate } from '@/lib/admin/format'

type WorkspaceRow = {
  id: string
  name: string
  slug: string
  subscription_status: string
  trial_ends_at: string | null
  stripe_customer_id: string | null
  created_at: string
}

export default async function AdminBillingPage() {
  const admin = createAdminClient()
  const { data: wsData } = await admin
    .from('workspaces')
    .select('id, name, slug, subscription_status, trial_ends_at, stripe_customer_id, created_at')
    .order('created_at', { ascending: false })

  const workspaces = (wsData ?? []) as WorkspaceRow[]
  const pastDue = workspaces.filter((w) => w.subscription_status === 'past_due')
  const trialing = workspaces
    .filter((w) => w.subscription_status === 'trialing')
    .map((w) => ({ ...w, daysLeft: daysUntil(w.trial_ends_at) }))
    .filter((w) => w.daysLeft !== null && w.daysLeft <= 14)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Billing actions
          </div>
          <h1 className="op-title">
            Money, <span className="it">resolved.</span>
          </h1>
          <p className="op-sub">
            Extend trials, comp plans, mark past-due accounts active after resolving out-of-Stripe.
            Every action lands in the audit log.
          </p>
        </div>
      </div>

      <div
        className="op-stats"
        style={{ marginBottom: 22, gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        <div className="op-stat">
          <div className="k">Past due</div>
          <div className="v" style={{ color: pastDue.length > 0 ? 'var(--op-crit)' : undefined }}>
            {pastDue.length}
          </div>
          {pastDue.length > 0 && (
            <div className="d down">
              <OpIcon name="warning" size={11} />
              Resolve ASAP
            </div>
          )}
        </div>
        <div className="op-stat">
          <div className="k">Trials ending ≤14d</div>
          <div className="v">{trialing.length}</div>
        </div>
        <div className="op-stat">
          <div className="k">Active subscriptions</div>
          <div className="v">
            {workspaces.filter((w) => w.subscription_status === 'active').length}
          </div>
        </div>
        <div className="op-stat">
          <div className="k">Pending payment</div>
          <div className="v">
            {workspaces.filter((w) => w.subscription_status === 'pending_payment').length}
          </div>
        </div>
      </div>

      {/* Past due */}
      {pastDue.length > 0 && (
        <div className="op-card" style={{ marginBottom: 18 }}>
          <div className="op-card-head">
            <h3>Past due — resolve ASAP</h3>
            <span className="op-chip crit">
              <span className="dot"></span>
              {pastDue.length}
            </span>
          </div>
          <div style={{ padding: 0 }}>
            {pastDue.map((w) => (
              <BillingRow
                key={w.id}
                workspaceId={w.id}
                stripeCustomerId={w.stripe_customer_id}
                title={w.name}
                tone="crit"
                icon="warning"
                meta="Payment failed or card declined"
                chip={<span className="op-chip crit">Past due</span>}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trials ending */}
      <div className="op-card" style={{ marginBottom: 18 }}>
        <div className="op-card-head">
          <h3>Trials ending soon</h3>
          <span className="op-chip warn">
            <span className="dot"></span>
            {trialing.length}
          </span>
        </div>
        <div style={{ padding: 0 }}>
          {trialing.length === 0 ? (
            <div className="op-empty">No trials expiring in the next 14 days.</div>
          ) : (
            trialing.map((w) => (
              <BillingRow
                key={w.id}
                workspaceId={w.id}
                stripeCustomerId={w.stripe_customer_id}
                title={w.name}
                tone="warn"
                icon={w.daysLeft && w.daysLeft <= 3 ? 'warning' : 'calendar'}
                meta={`Trial ends ${fmtDate(w.trial_ends_at)}`}
                chip={
                  <span className={'op-chip ' + (w.daysLeft && w.daysLeft <= 7 ? 'warn' : '')}>
                    {w.daysLeft}d left
                  </span>
                }
              />
            ))
          )}
        </div>
      </div>

      <div
        className="op-card"
        style={{
          padding: 22,
          background: 'var(--op-surface-2)',
          border: '1px dashed var(--op-line-1)',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <OpIcon name="info" size={14} />
          <div style={{ fontWeight: 500 }}>Stripe actions require env config</div>
        </div>
        <p className="mut" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55 }}>
          Extend-trial, change-plan and comp actions will be wired once production Stripe keys
          are set. Today these workspaces can be managed directly in the Stripe dashboard.
        </p>
      </div>
    </div>
  )
}

function BillingRow({
  workspaceId,
  stripeCustomerId,
  title,
  tone,
  icon,
  meta,
  chip,
}: {
  workspaceId: string
  stripeCustomerId: string | null
  title: string
  tone: 'crit' | 'warn' | 'info'
  icon: Parameters<typeof OpIcon>[0]['name']
  meta: string
  chip: React.ReactNode
}) {
  const bg =
    tone === 'crit'
      ? 'rgba(224,114,100,0.12)'
      : tone === 'warn'
        ? 'rgba(226,179,90,0.12)'
        : 'rgba(127,174,207,0.12)'
  const color =
    tone === 'crit' ? 'var(--op-crit)' : tone === 'warn' ? 'var(--op-warn)' : 'var(--op-info)'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 18px',
        borderBottom: '1px solid var(--op-line-2)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: bg,
          color,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <OpIcon name={icon} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <b style={{ fontWeight: 500 }}>{title}</b>
          {chip}
        </div>
        <div className="mut" style={{ fontSize: 12, marginTop: 3 }}>
          {meta}
        </div>
      </div>
      <Link href={`/admin/workspaces/${workspaceId}`} className="op-btn sm">
        <OpIcon name="eye" />
        View
      </Link>
      {stripeCustomerId && (
        <a
          href={`https://dashboard.stripe.com/customers/${stripeCustomerId}`}
          target="_blank"
          rel="noreferrer"
          className="op-btn sm"
        >
          <OpIcon name="stripe" />
          Stripe
        </a>
      )}
    </div>
  )
}
