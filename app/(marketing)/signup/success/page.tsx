import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, stripeConfigured } from '@/lib/stripe/client'
import { workspaceUrl } from '@/lib/cookies'

type Props = { searchParams: Promise<{ session_id?: string }> }

export default async function SignupSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams
  if (!session_id || !stripeConfigured()) redirect('/signup')

  const stripe = getStripe()!
  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ['subscription'],
  })

  const workspaceId = session.metadata?.workspace_id
  const workspaceSlug = session.metadata?.workspace_slug
  if (!workspaceId || !workspaceSlug) redirect('/signup')

  const subscription = session.subscription as import('stripe').Stripe.Subscription | null
  if (subscription) {
    const admin = createAdminClient()
    await admin
      .from('workspaces')
      .update({
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        stripe_subscription_id: subscription.id,
        subscription_status: 'trialing',
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      })
      .eq('id', workspaceId)
  }

  redirect(workspaceUrl(workspaceSlug, '/onboarding'))
}
