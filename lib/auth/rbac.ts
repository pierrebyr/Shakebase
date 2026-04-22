import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/constants'

export async function getMembershipRole(workspaceId: string, userId: string): Promise<Role | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('memberships')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .not('joined_at', 'is', null)
    .maybeSingle()
  const row = data as { role: string } | null
  return (row?.role as Role) ?? null
}

export function canWrite(role: Role | null): boolean {
  return role === 'owner' || role === 'editor'
}
