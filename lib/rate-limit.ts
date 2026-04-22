import 'server-only'
import { headers } from 'next/headers'

// Simple in-memory token bucket. Adequate for a single-instance deployment
// and dev. For production multi-instance, replace the Map with Upstash Redis
// or Supabase Edge Functions rate limiting. Key choice stays the same.

type Bucket = { count: number; reset: number }
const buckets = new Map<string, Bucket>()

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number }

type Options = {
  key: string
  limit: number
  windowMs: number
}

export function rateLimit({ key, limit, windowMs }: Options): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || existing.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return { ok: true }
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((existing.reset - now) / 1000) }
  }
  existing.count += 1
  return { ok: true }
}

export async function clientIp(): Promise<string> {
  const hdr = await headers()
  const xff = hdr.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return hdr.get('x-real-ip') ?? 'unknown'
}

// Periodic cleanup of expired buckets to avoid unbounded memory growth.
if (typeof globalThis !== 'undefined' && !('__rl_sweeper__' in globalThis)) {
  ;(globalThis as unknown as { __rl_sweeper__: boolean }).__rl_sweeper__ = true
  setInterval(
    () => {
      const now = Date.now()
      for (const [k, v] of buckets) {
        if (v.reset < now) buckets.delete(k)
      }
    },
    5 * 60 * 1000,
  ).unref?.()
}
