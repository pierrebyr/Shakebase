import 'server-only'
import { cookies, headers } from 'next/headers'
import { Redis } from '@upstash/redis'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import type { ActivityKind, ActivityTargetType } from './kinds'

// Dedupe cache — a 30 s sliding "seen recently" window keyed by
// (workspace, user, kind, target) suppresses duplicate events from
// RSC prefetch-then-navigate flows and hot reloads. Reuses the same
// Upstash instance the rate limiter uses; no extra env vars.

const upstashEnabled =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string' &&
  process.env.UPSTASH_REDIS_REST_TOKEN.length > 0

const redis = upstashEnabled ? Redis.fromEnv() : null

type Target = {
  type: ActivityTargetType
  id?: string | null
  label?: string | null
}

type TrackInput = {
  kind: ActivityKind
  target?: Target
  metadata?: Record<string, unknown>
  sessionId?: string | null
  // Override the default 30 s dedupe window. Pass 0 to always write.
  dedupeWindowSec?: number
}

// Fire-and-forget activity log. Never throws — tracking failures must
// not break user requests. Safe to `await` or ignore the returned
// promise.
export async function trackEvent(input: TrackInput): Promise<void> {
  try {
    const hdrs = await headers()
    // Next.js App Router sets this header on RSC prefetch requests.
    // Legacy `purpose: prefetch` covers pages router / old clients.
    if (hdrs.get('next-router-prefetch') === '1') return
    if (hdrs.get('purpose') === 'prefetch') return

    const user = await getUser()
    if (!user) return

    let workspaceId: string
    try {
      const workspace = await getCurrentWorkspace()
      workspaceId = workspace.id
    } catch {
      return
    }

    const targetId = input.target?.id ?? null
    const windowSec = input.dedupeWindowSec ?? 30
    if (redis && windowSec > 0) {
      const dedupeKey = `activity:dedupe:${workspaceId}:${user.id}:${input.kind}:${targetId ?? 'none'}`
      const ok = await redis.set(dedupeKey, '1', { nx: true, ex: windowSec })
      if (!ok) return
    }

    const cookieStore = await cookies()
    const isImpersonation = Boolean(cookieStore.get('sb_impersonation')?.value)

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { error } = await db.from('activity_events').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      kind: input.kind,
      target_type: input.target?.type ?? null,
      target_id: targetId,
      target_label: input.target?.label ?? null,
      metadata: input.metadata ?? {},
      session_id: input.sessionId ?? null,
      is_admin_impersonation: isImpersonation,
    })
    if (error && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[activity] insert failed:', error.message)
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[activity] trackEvent failed:', err)
    }
  }
}
