'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'

type Result = { ok: true } | { ok?: undefined; error: string }

export async function deleteCollectionFromListAction(collectionId: string): Promise<Result> {
  const user = await getUser()
  if (!user) return { error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  // Only the collection creator (or workspace owner) can delete.
  const admin = createAdminClient()
  const { data } = await admin
    .from('collections')
    .select('created_by')
    .eq('id', collectionId)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const createdBy = (data as { created_by: string | null } | null)?.created_by
  if (createdBy === undefined) return { error: 'Collection not found' }
  const isCreator = createdBy === user.id
  const isOwner = workspace.owner_user_id === user.id
  if (!isCreator && !isOwner) {
    return { error: 'Only the collection creator can delete it' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { error } = await db
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('workspace_id', workspace.id)
  if (error) return { error: error.message }

  revalidatePath('/collections')
  return { ok: true }
}
