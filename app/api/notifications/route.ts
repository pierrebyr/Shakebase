import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { getCurrentWorkspace } from '@/lib/workspace/context'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let workspaceId: string | null = null
  try {
    const workspace = await getCurrentWorkspace()
    workspaceId = workspace.id
  } catch {
    // Marketing / admin context — notifications are tenant-scoped so return empty.
    return NextResponse.json({ items: [], unread: 0 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('id, kind, title, body, url, actor_label, read_at, created_at')
    .eq('recipient_user_id', user.id)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(15)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = (data ?? []) as {
    id: string
    kind: string
    title: string
    body: string | null
    url: string | null
    actor_label: string | null
    read_at: string | null
    created_at: string
  }[]
  const unread = items.filter((n) => !n.read_at).length
  return NextResponse.json({ items, unread })
}
