import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace, isWorkspaceFrozen } from '@/lib/workspace/context'
import { requireUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, stripeConfigured } from '@/lib/stripe/client'
import { Icon } from '@/components/icons'

const PLAN_NAME = 'Studio'

function euroOrDollar(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return '—'
  const symbol = (currency ?? 'usd').toLowerCase() === 'eur' ? '€' : '$'
  return `${symbol}${(amount / 100).toFixed(2)}`
}

export default async function BillingSettingsPage() {
  const workspace = await getCurrentWorkspace()
  const user = await requireUser()
  const isOwner = workspace.owner_user_id === user.id
  if (!isOwner) redirect('/settings')
  const frozen = isWorkspaceFrozen(workspace)

  const admin = createAdminClient()

  // Load membership summary (seats)
  const { count: seatCount } = await admin
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)
    .not('joined_at', 'is', null)

  // Load audit for invoice events (we log via webhook)
  let invoices: {
    id: string
    number: string | null
    amount_paid: number | null
    currency: string | null
    created: number
    hosted_invoice_url: string | null
    status: string | null
  }[] = []

  let paymentMethod: { brand: string; last4: string; exp: string } | null = null
  let subscription: {
    status: string
    trial_end: number | null
    current_period_end: number | null
  } | null = null

  if (stripeConfigured() && workspace.stripe_customer_id) {
    const stripe = getStripe()!
    try {
      const [invs, sub, pm] = await Promise.all([
        stripe.invoices.list({ customer: workspace.stripe_customer_id, limit: 6 }),
        workspace.stripe_subscription_id
          ? stripe.subscriptions.retrieve(workspace.stripe_subscription_id)
          : Promise.resolve(null),
        stripe.customers.retrieve(workspace.stripe_customer_id, { expand: ['invoice_settings.default_payment_method'] }),
      ])
      invoices = invs.data.map((i) => ({
        id: i.id ?? '',
        number: i.number ?? null,
        amount_paid: i.amount_paid,
        currency: i.currency,
        created: i.created,
        hosted_invoice_url: i.hosted_invoice_url ?? null,
        status: i.status ?? null,
      }))
      if (sub) {
        subscription = {
          status: sub.status,
          trial_end: sub.trial_end,
          current_period_end: (sub as unknown as { current_period_end: number }).current_period_end,
        }
      }
      const cust = pm as unknown as {
        invoice_settings?: {
          default_payment_method?: { card?: { brand: string; last4: string; exp_month: number; exp_year: number } }
        }
      }
      const card = cust.invoice_settings?.default_payment_method?.card
      if (card) {
        paymentMethod = {
          brand: card.brand,
          last4: card.last4,
          exp: `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(2)}`,
        }
      }
    } catch (err) {
      console.error('[billing] stripe fetch failed', err)
    }
  }

  const trialEndsAt =
    subscription?.trial_end != null
      ? new Date(subscription.trial_end * 1000)
      : workspace.trial_ends_at
        ? new Date(workspace.trial_ends_at)
        : null
  const renewsAt =
    subscription?.current_period_end != null
      ? new Date(subscription.current_period_end * 1000)
      : null

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">Account &amp; workspace</div>
        <h1 className="page-title" style={{ textWrap: 'balance' }}>
          Billing.
        </h1>
        <p className="page-sub">
          Manage the subscription for {workspace.name}, view invoices, and update your payment
          method.
        </p>
      </div>

      {workspace.subscription_status === 'gifted' && (
        <div
          className="card"
          style={{
            padding: 32,
            borderRadius: 18,
            background:
              'linear-gradient(135deg, var(--accent-wash), #f0dfc0 60%, var(--bg-elev))',
            border: '1px solid rgba(196,145,85,0.35)',
            marginBottom: 20,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10.5,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--accent-ink)',
              marginBottom: 12,
            }}
          >
            Gifted workspace
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 40,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'var(--ink-1)',
            }}
          >
            On the house.
          </h2>
          <p
            style={{
              margin: '16px 0 0',
              fontSize: 13.5,
              color: 'var(--ink-2)',
              lineHeight: 1.55,
              maxWidth: '54ch',
            }}
          >
            {workspace.name} has been gifted by the ShakeBase team. Full access to every
            feature — unlimited cocktails, 25 team seats, all venues, priority support —
            with no billing, no trial clock, no card on file.
          </p>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 12.5,
              color: 'var(--ink-3)',
              lineHeight: 1.55,
            }}
          >
            Questions? Reach out to{' '}
            <a href="mailto:hello@shakebase.co" style={{ color: 'var(--accent-ink)' }}>
              hello@shakebase.co
            </a>
            .
          </p>
        </div>
      )}

      {/* Plan card */}
      {workspace.subscription_status !== 'gifted' && (
      <>
      <div
        className="card"
        style={{
          padding: 28,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #1a1918 0%, #3a3027 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,145,85,0.4), transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          Current plan
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 40,
            lineHeight: 1,
            marginTop: 10,
            letterSpacing: '-0.02em',
          }}
        >
          {PLAN_NAME}
        </div>
        <p
          style={{
            margin: '16px 0 0',
            fontSize: 13,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.5,
            maxWidth: '48ch',
          }}
        >
          Unlimited cocktails, 25 team seats, all venues, priority R&amp;D support.
          {renewsAt && (
            <>
              {' '}
              <strong style={{ color: '#fff', fontWeight: 500 }}>
                Next renewal {renewsAt.toLocaleDateString()}.
              </strong>
            </>
          )}
          {trialEndsAt && subscription?.status === 'trialing' && (
            <>
              {' '}
              <strong style={{ color: '#fff', fontWeight: 500 }}>
                Trial ends {trialEndsAt.toLocaleDateString()}.
              </strong>
            </>
          )}
        </p>

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Seats used
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 26,
                marginTop: 4,
              }}
            >
              {seatCount ?? 0}{' '}
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>/ 25</span>
            </div>
          </div>

          {isOwner && workspace.stripe_customer_id && stripeConfigured() && (
            <form action="/api/stripe/portal" method="POST">
              <button
                type="submit"
                className="btn-secondary"
                style={{ background: '#fff', color: 'var(--ink-1)' }}
              >
                Manage plan
              </button>
            </form>
          )}
        </div>

        <div
          style={{
            height: 5,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 999,
            overflow: 'hidden',
            marginTop: 14,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, ((seatCount ?? 0) / 25) * 100)}%`,
              background: 'linear-gradient(90deg, #f5d9a9, #c49155)',
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      {!stripeConfigured() && (
        <div
          className="card card-pad"
          style={{
            padding: 22,
            borderColor: 'rgba(196,138,31,0.3)',
            background: '#f6e9cf',
            marginBottom: 20,
          }}
        >
          <div className="panel-title" style={{ color: 'var(--warn)', marginBottom: 6 }}>
            Stripe not configured
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
            Set <code>STRIPE_SECRET_KEY</code>, <code>STRIPE_WEBHOOK_SECRET</code>, and{' '}
            <code>STRIPE_STUDIO_PRICE_ID</code> in <code>.env.local</code> to enable real billing.
            Until then, signups run in dev mode without charging a card.
          </p>
        </div>
      )}

      {frozen && (
        <div
          className="card card-pad"
          style={{
            padding: 22,
            borderColor: '#f0cccc',
            background: '#fdf7f7',
            marginBottom: 20,
          }}
        >
          <div className="panel-title" style={{ color: 'var(--crit)', marginBottom: 6 }}>
            Workspace frozen
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
            Reading is still allowed, but edits are paused. Update billing above to unfreeze.
          </p>
        </div>
      )}

      {/* Payment method */}
      <div className="card card-pad" style={{ padding: 28, marginBottom: 20 }}>
        <div className="panel-title" style={{ marginBottom: 14 }}>
          Payment method
        </div>
        {paymentMethod ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div className="row gap-sm">
              <div
                className="mono"
                style={{
                  padding: '7px 12px',
                  border: '1px solid var(--line-1)',
                  borderRadius: 10,
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}
              >
                {paymentMethod.brand} · •••• {paymentMethod.last4}
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                exp {paymentMethod.exp}
              </span>
            </div>
            {isOwner && (
              <form action="/api/stripe/portal" method="POST">
                <button type="submit" className="btn-ghost" style={{ fontSize: 12 }}>
                  Update
                </button>
              </form>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            {stripeConfigured()
              ? 'No card on file yet.'
              : 'Stripe not configured — no payment method captured.'}
          </p>
        )}
      </div>

      {/* Invoices */}
      <div className="card card-pad" style={{ padding: 28 }}>
        <div className="panel-title" style={{ marginBottom: 12 }}>
          Recent invoices
        </div>
        {invoices.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            No invoices yet. The first charge happens at the end of your trial.
          </p>
        ) : (
          <div>
            {invoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr auto auto auto',
                  gap: 14,
                  padding: '14px 0',
                  borderTop: '1px solid var(--line-2)',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--bg-sunken)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--ink-3)',
                  }}
                >
                  <Icon name="file" size={15} />
                </div>
                <div className="col">
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>
                    {inv.number ?? inv.id.slice(0, 12)}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 11.5, color: 'var(--ink-4)' }}
                  >
                    {new Date(inv.created * 1000).toLocaleDateString()}
                  </span>
                </div>
                <span className="mono" style={{ fontSize: 12 }}>
                  {euroOrDollar(inv.amount_paid, inv.currency)}
                </span>
                <span
                  className="pill"
                  style={
                    inv.status === 'paid'
                      ? { background: '#e3f0e9', color: 'var(--ok)', borderColor: 'transparent' }
                      : undefined
                  }
                >
                  {inv.status ?? 'open'}
                </span>
                {inv.hosted_invoice_url && (
                  <a
                    href={inv.hosted_invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    style={{ fontSize: 12 }}
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </>
  )
}
