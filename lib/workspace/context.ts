import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database'

type Workspace = Database['public']['Tables']['workspaces']['Row']

export async function getWorkspaceSlug() {
  const h = await headers()
  return h.get('x-workspace-slug')
}

// Resolves the workspace from the subdomain. Uses service_role because the
// slug is already visible in the URL, so the workspace's *existence* is not
// sensitive. Data reads inside the workspace still go through the user
// session client so RLS enforces membership.
export async function getCurrentWorkspace(): Promise<Workspace> {
  const slug = await getWorkspaceSlug()
  if (!slug) notFound()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) notFound()
  return data as Workspace
}

export function isWorkspaceFrozen(ws: Workspace): boolean {
  if (ws.subscription_status === 'frozen' || ws.subscription_status === 'canceled') return true
  if (
    ws.subscription_status === 'past_due' &&
    ws.frozen_at &&
    new Date(ws.frozen_at) < new Date()
  )
    return true
  return false
}
