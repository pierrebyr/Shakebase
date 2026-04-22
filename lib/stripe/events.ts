import 'server-only'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { FREEZE_GRACE_DAYS } from '@/lib/constants'
import { sendEmail } from '@/lib/email/send'
import { renderBillingReceipt } from '@/lib/email/templates'
import { workspaceUrl } from '@/lib/cookies'

const admin = () => createAdminClient()

function plusDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function subTrialEndIso(sub: Stripe.Subscription): string | null {
  return sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
}

async function updateByCustomer(customerId: string, patch: Record<string, unknown>) {
  await admin().from('workspaces').update(patch).eq('stripe_customer_id', customerId)
}

async function updateBySubscription(subscriptionId: string, patch: Record<string, unknown>) {
  await admin().from('workspaces').update(patch).eq('stripe_subscription_id', subscriptionId)
}

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const workspaceId = session.metadata?.workspace_id
      if (!workspaceId) return
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      await admin()
        .from('workspaces')
        .update({
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: subscriptionId ?? null,
          subscription_status: 'trialing',
        })
        .eq('id', workspaceId)
      return
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const status =
        sub.status === 'trialing' || sub.status === 'active'
          ? sub.status
          : sub.status === 'past_due'
            ? 'past_due'
            : sub.status === 'canceled'
              ? 'canceled'
              : 'trialing'
      await updateBySubscription(sub.id, {
        subscription_status: status,
        trial_ends_at: subTrialEndIso(sub),
      })
      return
    }
    case 'customer.subscription.trial_will_end': {
      // J-3 email hook — wire Resend in Phase 5.
      return
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      if (customerId) {
        await updateByCustomer(customerId, {
          subscription_status: 'active',
          frozen_at: null,
        })
      }
      // Fire-and-forget receipt email. Only send if the payment is
      // non-zero (skip $0 trial invoices) and we can resolve the workspace.
      if (customerId && (invoice.amount_paid ?? 0) > 0) {
        try {
          const { data: ws } = await admin()
            .from('workspaces')
            .select('id, slug, name')
            .eq('stripe_customer_id', customerId)
            .maybeSingle()
          const w = ws as { id: string; slug: string; name: string } | null
          if (w && invoice.customer_email) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inv = invoice as any
            const fmt = (cents: number) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: (invoice.currency ?? 'usd').toUpperCase(),
              }).format(cents / 100)
            const fmtDate = (secs: number | null) =>
              secs
                ? new Date(secs * 1000).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'
            const card = inv.charge?.payment_method_details?.card
            const lines = (inv.lines?.data ?? []) as Array<{
              amount?: number
              description?: string | null
              quantity?: number | null
              period?: { start?: number; end?: number }
            }>
            const planLine = lines[0]
            const planAmount = planLine?.amount ?? inv.subtotal ?? 0
            const periodStart = planLine?.period?.start ?? inv.period_start
            const periodEnd = planLine?.period?.end ?? inv.period_end

            const rendered = renderBillingReceipt({
              workspaceName: w.name,
              invoiceNumber: invoice.number ?? inv.id,
              chargedAt: fmtDate(inv.status_transitions?.paid_at ?? inv.created),
              totalAmount: fmt(invoice.amount_paid ?? inv.total ?? 0),
              cardLast4: card?.last4 ?? '••••',
              seatCount: planLine?.quantity ?? 1,
              billingPeriod: `${fmtDate(periodStart)} – ${fmtDate(periodEnd)}`,
              planAmount: fmt(planAmount),
              proratedDesc: '—',
              proratedAmount: fmt(0),
              taxAmount: fmt(inv.tax ?? 0),
              vatRate: inv.tax ? 'applicable' : '0%',
              billingCountry: inv.account_country ?? 'FR',
              nextRenewal: fmtDate(inv.next_payment_attempt ?? null),
              invoicePdfUrl: invoice.invoice_pdf ?? workspaceUrl(w.slug, '/settings/billing'),
              billingSettingsUrl: workspaceUrl(w.slug, '/settings/billing'),
            })
            sendEmail({
              to: invoice.customer_email,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
            }).catch((err) => console.error('[stripe] receipt email failed:', err))
          }
        } catch (err) {
          console.error('[stripe] receipt render failed:', err)
        }
      }
      return
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      if (customerId) {
        await updateByCustomer(customerId, {
          subscription_status: 'past_due',
          frozen_at: plusDays(FREEZE_GRACE_DAYS),
        })
      }
      return
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updateBySubscription(sub.id, {
        subscription_status: 'canceled',
        frozen_at: plusDays(FREEZE_GRACE_DAYS),
      })
      return
    }
  }
}
