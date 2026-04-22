import { NextResponse, type NextRequest } from 'next/server'
import { getStripe, stripeConfigured } from '@/lib/stripe/client'
import { getUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { workspaceUrl } from '@/lib/cookies'

// Owner-only: opens a Stripe Customer Portal session so the owner can manage
// payment methods, view invoices, update billing email, or cancel.
export async function POST(req: NextRequest) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  // Resolve workspace from the subdomain header set by middleware.
  const slug = req.headers.get('x-workspace-slug')
  if (!slug) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const admin = createAdminClient()
  const { data: ws } = await admin
    .from('workspaces')
    .select('id, slug, owner_user_id, stripe_customer_id')
    .eq('slug', slug)
    .maybeSingle()
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // Only the owner may manage billing (super-admin bypass optional, skipped for now).
  if (ws.owner_user_id !== user.id) {
    return NextResponse.json({ error: 'Only the workspace owner can manage billing' }, { status: 403 })
  }

  if (!ws.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No Stripe customer on file. Complete signup to attach a customer.' },
      { status: 409 },
    )
  }

  const stripe = getStripe()!
  const session = await stripe.billingPortal.sessions.create({
    customer: ws.stripe_customer_id,
    return_url: workspaceUrl(ws.slug, '/settings/billing'),
  })

  return NextResponse.redirect(session.url, { status: 303 })
}
