import 'server-only'
import { getStripe } from './client'
import { marketingUrl, workspaceUrl } from '@/lib/cookies'
import { TRIAL_DAYS } from '@/lib/constants'

export type CheckoutArgs = {
  workspaceId: string
  workspaceSlug: string
  customerEmail: string
}

export async function createTrialCheckoutSession(args: CheckoutArgs): Promise<string | null> {
  const stripe = getStripe()
  const priceId = process.env.STRIPE_STUDIO_PRICE_ID
  if (!stripe || !priceId) return null

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_collection: 'always',
    customer_email: args.customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: {
        workspace_id: args.workspaceId,
        workspace_slug: args.workspaceSlug,
      },
    },
    metadata: {
      workspace_id: args.workspaceId,
      workspace_slug: args.workspaceSlug,
    },
    success_url: marketingUrl(`/signup/success?session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: marketingUrl('/signup?cancelled=1'),
  })

  return session.url
}
