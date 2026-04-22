'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'

export async function togglePricingEnabledAction(
  enabled: boolean,
): Promise<{ ok: true } | { ok?: undefined; error: string }> {
  const user = await getUser()
  if (!user) return { error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Upsert: row may not exist yet for newer workspaces.
  const { error } = await db
    .from('workspace_settings')
    .upsert(
      { workspace_id: workspace.id, pricing_enabled: enabled },
      { onConflict: 'workspace_id' },
    )
  if (error) return { error: error.message }

  revalidatePath('/analytics')
  revalidatePath('/settings/general')
  return { ok: true }
}
