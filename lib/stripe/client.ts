import 'server-only'
import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (cached) return cached
  cached = new Stripe(key, {
    // Pin API version to avoid silent upgrades; bump intentionally when
    // we test against a new version.
    apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
  })
  return cached
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_STUDIO_PRICE_ID)
}
