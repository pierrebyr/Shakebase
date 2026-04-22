'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'

export type CollectionMutationResult = { ok: true } | { ok: false; error: string }

// Collections are editable only by the creator. Workspace owners can also
// edit/delete them so they can clean up after a member leaves.
async function assertCanEditCollection(
  collectionId: string,
  userId: string,
  workspace: { id: string; owner_user_id: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('collections')
    .select('created_by')
    .eq('id', collectionId)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const created_by = (data as { created_by: string | null } | null)?.created_by
  if (created_by === undefined) return { ok: false, error: 'Collection not found' }
  const isCreator = created_by === userId
  const isOwner = workspace.owner_user_id === userId
  if (!isCreator && !isOwner) {
    return { ok: false, error: 'Only the collection creator can edit or delete it' }
  }
  return { ok: true }
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
  cover_from: z.string(),
  cover_to: z.string(),
  pinned: z.string().optional(),
})

export async function updateCollectionAction(
  _: unknown,
  formData: FormData,
): Promise<CollectionMutationResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = UpdateSchema.safeParse({
    id: formData.get('id'),
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    cover_from: String(formData.get('cover_from') ?? ''),
    cover_to: String(formData.get('cover_to') ?? ''),
    pinned: String(formData.get('pinned') ?? ''),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }

  const gate = await assertCanEditCollection(parsed.data.id, user.id, workspace)
  if (!gate.ok) return gate

  const supabase = await createClient()
  const { error } = await supabase
    .from('collections')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      cover_from: parsed.data.cover_from,
      cover_to: parsed.data.cover_to,
      pinned: parsed.data.pinned === 'on',
    } as never)
    .eq('id', parsed.data.id)
    .eq('workspace_id', workspace.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/collections/${parsed.data.id}`)
  revalidatePath('/collections')
  return { ok: true }
}

const DeleteSchema = z.object({ id: z.string().uuid() })

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()

  const parsed = DeleteSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) throw new Error('Invalid form')

  const gate = await assertCanEditCollection(parsed.data.id, user.id, workspace)
  if (!gate.ok) throw new Error(gate.error)

  const supabase = await createClient()
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', parsed.data.id)
    .eq('workspace_id', workspace.id)
  if (error) throw new Error(error.message)

  redirect('/collections')
}

const RemoveSchema = z.object({
  collection_id: z.string().uuid(),
  cocktail_id: z.string().uuid(),
})

export async function removeFromCollectionAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()

  const parsed = RemoveSchema.safeParse({
    collection_id: formData.get('collection_id'),
    cocktail_id: formData.get('cocktail_id'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  // Verify collection ownership
  const { data: col } = await supabase
    .from('collections')
    .select('id')
    .eq('id', parsed.data.collection_id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!col) throw new Error('Collection not found')

  const { error } = await supabase
    .from('collection_cocktails')
    .delete()
    .eq('collection_id', parsed.data.collection_id)
    .eq('cocktail_id', parsed.data.cocktail_id)
  if (error) throw new Error(error.message)

  revalidatePath(`/collections/${parsed.data.collection_id}`)
}

const AddSchema = z.object({
  collection_id: z.string().uuid(),
  cocktail_ids: z.array(z.string().uuid()),
})

export async function setCollectionMembershipsAction(
  cocktailId: string,
  collectionIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const supabase = await createClient()

  // All collection ids must belong to this workspace
  const { data: cols } = await supabase
    .from('collections')
    .select('id')
    .eq('workspace_id', workspace.id)
    .in('id', collectionIds.length > 0 ? collectionIds : ['00000000-0000-0000-0000-000000000000'])
  const validIds = new Set(((cols ?? []) as { id: string }[]).map((c) => c.id))

  // Current memberships for this cocktail
  const { data: currentRows } = await supabase
    .from('collection_cocktails')
    .select('collection_id, collections!inner(workspace_id)')
    .eq('cocktail_id', cocktailId)
  const currentIds = new Set(
    ((currentRows ?? []) as { collection_id: string }[]).map((r) => r.collection_id),
  )

  const desired = new Set(collectionIds.filter((id) => validIds.has(id)))
  const toAdd = [...desired].filter((id) => !currentIds.has(id))
  const toRemove = [...currentIds].filter((id) => !desired.has(id))

  if (toAdd.length > 0) {
    await supabase.from('collection_cocktails').insert(
      toAdd.map((collection_id) => ({ collection_id, cocktail_id: cocktailId })) as never,
    )
  }
  if (toRemove.length > 0) {
    await supabase
      .from('collection_cocktails')
      .delete()
      .eq('cocktail_id', cocktailId)
      .in('collection_id', toRemove)
  }

  for (const id of desired) {
    revalidatePath(`/collections/${id}`)
  }
  revalidatePath('/collections')
  return { ok: true }
}
