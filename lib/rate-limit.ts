import 'server-only'
import { headers } from 'next/headers'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Upstash Redis backs the limiter in production. On dev / any environment
// where UPSTASH_REDIS_REST_URL isn't set, we fall back to an in-memory
// bucket. The fallback is adequate for local dev but useless across Vercel
// serverless instances — production MUST have Upstash configured.

const upstashEnabled =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string' &&
  process.env.UPSTASH_REDIS_REST_TOKEN.length > 0

const redis = upstashEnabled ? Redis.fromEnv() : null

// Cache compiled Ratelimit instances per window to avoid recreating them
// on every request.
const rlCache = new Map<string, Ratelimit>()
function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null
  const cacheKey = `${limit}:${windowMs}`
  const hit = rlCache.get(cacheKey)
  if (hit) return hit
  const windowStr: `${number} ms` = `${windowMs} ms`
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, windowStr),
    analytics: false,
    prefix: 'rl',
  })
  rlCache.set(cacheKey, rl)
  return rl
}

// In-memory fallback for dev / when Upstash isn't configured.
type Bucket = { count: number; reset: number }
const buckets = new Map<string, Bucket>()

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number }

type Options = {
  key: string
  limit: number
  windowMs: number
}

export async function rateLimit({
  key,
  limit,
  windowMs,
}: Options): Promise<RateLimitResult> {
  // Prefer Upstash when configured — works across serverless instances.
  const upstash = getUpstashLimiter(limit, windowMs)
  if (upstash) {
    const result = await upstash.limit(key)
    if (result.success) return { ok: true }
    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
    return { ok: false, retryAfter }
  }

  // In-memory fallback.
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

// Periodic cleanup of expired in-memory buckets to avoid unbounded growth.
// No-op when Upstash is doing the work.
if (!upstashEnabled && typeof globalThis !== 'undefined' && !('__rl_sweeper__' in globalThis)) {
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

export function rateLimitErrorMessage(retryAfter: number): string {
  if (retryAfter < 60) return `Too many attempts. Try again in ${retryAfter}s.`
  const mins = Math.ceil(retryAfter / 60)
  return `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`
}
