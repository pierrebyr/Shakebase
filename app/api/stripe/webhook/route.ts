import { NextResponse, type NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { handleStripeEvent } from '@/lib/stripe/events'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    // In production we REFUSE loudly — silent stubs would let billing
    // events drop on the floor. 503 triggers Stripe's retry queue so no
    // events are lost while the ops issue is fixed.
    if (process.env.NODE_ENV === 'production') {
      console.error('[stripe webhook] missing STRIPE_WEBHOOK_SECRET in production — refusing')
      return NextResponse.json(
        { error: 'Stripe webhook not configured on server' },
        { status: 503 },
      )
    }
    // Dev stub — keep the endpoint a stable target for `stripe listen`.
    const body = await req.text()
    console.log('[stripe webhook] stub — no STRIPE_WEBHOOK_SECRET configured. Body:', body.slice(0, 200))
    return NextResponse.json({ received: true, stub: true })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const rawBody = await req.text()
  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Idempotency — per-event-id insert. On conflict we return early.
  const admin = createAdminClient()
  const { error: insertError } = await admin
    .from('stripe_webhook_events')
    .insert({
      id: event.id,
      type: event.type,
      payload: event as never,
    })

  // If the insert failed due to duplicate PK, we've already processed this event.
  // We still return 200 so Stripe stops retrying.
  if (insertError && insertError.code !== '23505') {
    // Any other error is unexpected — log and return 500 to trigger Stripe retry.
    console.error('[stripe webhook] idempotency insert failed:', insertError)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  if (insertError?.code === '23505') {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    await handleStripeEvent(event)
  } catch (err) {
    console.error('[stripe webhook] handler failed:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
