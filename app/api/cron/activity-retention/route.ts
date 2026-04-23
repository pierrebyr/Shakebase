import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Scheduled daily via Vercel Cron (see vercel.json). Deletes activity
// events older than 90 days. Authenticated by the CRON_SECRET env var
// that Vercel passes as `Authorization: Bearer <secret>`. External
// callers without the secret get a 401.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RETENTION_DAYS = 90

export async function GET(req: Request): Promise<NextResponse> {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    // Never allow the endpoint to run without a secret configured.
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString()
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { count, error } = await db
    .from('activity_events')
    .delete({ count: 'exact' })
    .lt('occurred_at', cutoff)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    deleted: count ?? 0,
    cutoff,
    retention_days: RETENTION_DAYS,
  })
}
