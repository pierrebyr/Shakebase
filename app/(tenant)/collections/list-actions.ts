'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'

type Result = { ok: true } | { ok?: undefined; error: string }

export async function deleteCollectionFromListAction(collectionId: string): Promise<Result> {
  const user = await getUser()
  if (!user) return { error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()
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
