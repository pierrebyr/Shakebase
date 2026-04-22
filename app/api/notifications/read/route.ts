import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// POST /api/notifications/read
// Body: { ids?: string[] }  — empty or missing => mark all unread as read.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let ids: string[] = []
  try {
    const body = (await request.json()) as { ids?: unknown }
    if (Array.isArray(body?.ids)) ids = body.ids.filter((v): v is string => typeof v === 'string')
  } catch {
    // Empty body is valid — means "mark all".
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('notifications')
    .update({ read_at: now } as never)
    .eq('recipient_user_id', user.id)
    .is('read_at', null)
  if (ids.length > 0) query = query.in('id', ids)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
