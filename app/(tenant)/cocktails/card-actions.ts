'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { trackEvent } from '@/lib/activity/track'
import { ACTIVITY_KINDS } from '@/lib/activity/kinds'

type Result = { ok: true } | { ok?: undefined; error: string }

export async function toggleFavoriteAction(cocktailId: string): Promise<Result> {
  const user = await getUser()
  if (!user) return { error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verify cocktail belongs to this workspace
  const { data: cocktail } = await db
    .from('cocktails')
    .select('id, name')
    .eq('id', cocktailId)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!cocktail) return { error: 'Cocktail not found' }

  const { data: existing } = await db
    .from('user_cocktail_favorites')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('cocktail_id', cocktailId)
    .maybeSingle()

  let toggledTo: 'favorite' | 'unfavorite'
  if (existing) {
    const { error } = await db
      .from('user_cocktail_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('cocktail_id', cocktailId)
    if (error) return { error: error.message }
    toggledTo = 'unfavorite'
  } else {
    const { error } = await db.from('user_cocktail_favorites').insert({
      user_id: user.id,
      cocktail_id: cocktailId,
      workspace_id: workspace.id,
    })
    if (error) return { error: error.message }
    toggledTo = 'favorite'
  }

  await trackEvent({
    kind:
      toggledTo === 'favorite'
        ? ACTIVITY_KINDS.COCKTAIL_FAVORITE
        : ACTIVITY_KINDS.COCKTAIL_UNFAVORITE,
    target: { type: 'cocktail', id: cocktail.id, label: cocktail.name },
    // Mutations are always worth logging — skip the dedupe so repeated
    // toggles show up distinctly in the timeline.
    dedupeWindowSec: 0,
  })

  revalidatePath('/cocktails')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function toggleCollectionMembershipAction(
  cocktailId: string,
  collectionId: string,
): Promise<Result> {
  const user = await getUser()
  if (!user) return { error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verify both belong to this workspace
  const { data: col } = await db
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!col) return { error: 'Collection not found' }

  const { data: cocktail } = await db
    .from('cocktails')
    .select('id')
    .eq('id', cocktailId)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!cocktail) return { error: 'Cocktail not found' }

  const { data: existing } = await db
    .from('collection_cocktails')
    .select('collection_id')
    .eq('collection_id', collectionId)
    .eq('cocktail_id', cocktailId)
    .maybeSingle()

  if (existing) {
    const { error } = await db
      .from('collection_cocktails')
      .delete()
      .eq('collection_id', collectionId)
      .eq('cocktail_id', cocktailId)
    if (error) return { error: error.message }
  } else {
    const { error } = await db
      .from('collection_cocktails')
      .insert({ collection_id: collectionId, cocktail_id: cocktailId })
    if (error) return { error: error.message }
  }

  revalidatePath('/cocktails')
  revalidatePath('/collections')
  revalidatePath(`/collections/${collectionId}`)
  return { ok: true }
}

export async function createCollectionWithCocktailAction(
  cocktailId: string,
  name: string,
): Promise<{ ok: true; id: string } | { ok?: undefined; error: string }> {
  const user = await getUser()
  if (!user) return { error: 'Not signed in' }
  const trimmed = name.trim()
  if (trimmed.length < 2) return { error: 'Name too short' }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: cocktail } = await db
    .from('cocktails')
    .select('id')
    .eq('id', cocktailId)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!cocktail) return { error: 'Cocktail not found' }

  const { data: col, error } = await db
    .from('collections')
    .insert({
      workspace_id: workspace.id,
      name: trimmed,
      created_by: user.id,
    })
    .select('id')
    .single()
  if (error || !col) return { error: error?.message ?? 'Insert failed' }

  const { error: linkErr } = await db
    .from('collection_cocktails')
    .insert({ collection_id: col.id, cocktail_id: cocktailId })
  if (linkErr) return { error: linkErr.message }

  revalidatePath('/cocktails')
  revalidatePath('/collections')
  return { ok: true, id: col.id }
}
