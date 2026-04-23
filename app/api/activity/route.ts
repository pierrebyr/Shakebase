import { NextResponse } from 'next/server'
import { trackEvent } from '@/lib/activity/track'
import { ACTIVITY_KINDS, type ActivityKind, type ActivityTargetType } from '@/lib/activity/kinds'
import { getUser } from '@/lib/auth/session'
import { rateLimit } from '@/lib/rate-limit'

const VALID_KINDS = new Set<string>(Object.values(ACTIVITY_KINDS))
const VALID_TARGET_TYPES = new Set<string>([
  'cocktail',
  'product',
  'creator',
  'page',
  'ingredient',
])

type EventInput = {
  kind: string
  target?: {
    type?: string
    id?: string | null
    label?: string | null
  }
  metadata?: Record<string, unknown>
  session_id?: string | null
}

const MAX_BATCH = 20

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getUser()
  if (!user) {
    // Silent accept — tracking endpoint should never surface "not authed"
    // as a user-facing error. Stats for logged-out users just don't land.
    return NextResponse.json({ ok: true, written: 0 })
  }

  // 300 events/minute per user is generous for normal browsing but caps
  // accidental loops or malicious spam well before we notice it in the DB.
  const rl = await rateLimit({
    key: `activity:${user.id}`,
    limit: 300,
    windowMs: 60_000,
  })
  if (!rl.ok) {
    // Silently drop — don't expose the limit to the client.
    return NextResponse.json({ ok: true, written: 0 })
  }

  let payload: { events?: EventInput[] }
  try {
    payload = (await req.json()) as { events?: EventInput[] }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const events = Array.isArray(payload.events) ? payload.events.slice(0, MAX_BATCH) : []
  if (events.length === 0) {
    return NextResponse.json({ ok: true, written: 0 })
  }

  let written = 0
  for (const ev of events) {
    if (typeof ev?.kind !== 'string' || !VALID_KINDS.has(ev.kind)) continue
    const kind = ev.kind as ActivityKind

    const rawType = ev.target?.type
    const targetType: ActivityTargetType | undefined =
      typeof rawType === 'string' && VALID_TARGET_TYPES.has(rawType)
        ? (rawType as ActivityTargetType)
        : undefined

    await trackEvent({
      kind,
      target: targetType
        ? {
            type: targetType,
            id: typeof ev.target?.id === 'string' ? ev.target.id : null,
            label: typeof ev.target?.label === 'string' ? ev.target.label : null,
          }
        : undefined,
      metadata:
        ev.metadata && typeof ev.metadata === 'object' ? ev.metadata : undefined,
      sessionId: typeof ev.session_id === 'string' ? ev.session_id : null,
    })
    written += 1
  }

  return NextResponse.json({ ok: true, written })
}
