'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { inferIngredientCategory } from '@/lib/ingredient-slug'

export type IngredientHit = {
  kind: 'global' | 'workspace'
  id: string
  name: string
  category: string | null
}

// Search the shared catalog + the current workspace's private pantry.
// Returns the top matches ordered by exact-prefix first, then substring.
export async function searchIngredientsAction(
  query: string,
  limit = 8,
): Promise<IngredientHit[]> {
  const q = query.trim()
  if (q.length < 1) return []
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const pattern = `%${q}%`
  const prefix = `${q}%`

  const [{ data: globals }, { data: ws }] = await Promise.all([
    supabase
      .from('global_ingredients')
      .select('id, name, category')
      .ilike('name', pattern)
      .limit(20),
    supabase
      .from('workspace_ingredients')
      .select('id, name, category')
      .eq('workspace_id', workspace.id)
      .ilike('name', pattern)
      .limit(10),
  ])

  type Row = { id: string; name: string; category: string | null }
  const hits: IngredientHit[] = [
    ...((globals ?? []) as Row[]).map((r) => ({ kind: 'global' as const, ...r })),
    ...((ws ?? []) as Row[]).map((r) => ({ kind: 'workspace' as const, ...r })),
  ]

  // Rank: exact prefix match first, then substring, alpha tiebreak
  const prefixRe = new RegExp(`^${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
  hits.sort((a, b) => {
    const ap = prefixRe.test(a.name) ? 0 : 1
    const bp = prefixRe.test(b.name) ? 0 : 1
    if (ap !== bp) return ap - bp
    // Prefer workspace matches when named the same (rare, but a signal of relevance)
    if (a.kind !== b.kind) return a.kind === 'workspace' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return hits.slice(0, limit)
}

// Add an ingredient to a cocktail, supporting either an existing FK
// (global or workspace) or a brand-new name (upserts into global).
export async function addIngredientFromAutocompleteAction(input: {
  cocktail_id: string
  selected: { kind: 'global' | 'workspace'; id: string } | null
  new_name: string | null
  amount: number | null
  unit: string | null
  notes: string | null
}): Promise<{ ok: true } | { ok?: undefined; error: string }> {
  const user = await getUser()
  if (!user) return { error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verify ownership
  const { data: cocktail } = await db
    .from('cocktails')
    .select('id')
    .eq('id', input.cocktail_id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!cocktail) return { error: 'Cocktail not found' }

  // Determine the FK
  let globalId: string | null = null
  let workspaceId: string | null = null

  if (input.selected) {
    if (input.selected.kind === 'global') globalId = input.selected.id
    else workspaceId = input.selected.id
  } else if (input.new_name && input.new_name.trim().length >= 2) {
    const name = input.new_name.trim()
    // Upsert into global by unique name
    const category = inferIngredientCategory(name).toLowerCase().split(' ')[0]
    const { data: existing } = await db
      .from('global_ingredients')
      .select('id')
      .eq('name', name)
      .maybeSingle()
    if (existing) {
      globalId = (existing as { id: string }).id
    } else {
      const { data: inserted, error } = await db
        .from('global_ingredients')
        .insert({ name, category })
        .select('id')
        .single()
      if (error || !inserted) return { error: error?.message ?? 'Insert failed' }
      globalId = (inserted as { id: string }).id
    }
  } else {
    return { error: 'Pick an ingredient or type a name' }
  }

  // Next position
  const { data: existing } = await db
    .from('cocktail_ingredients')
    .select('position')
    .eq('cocktail_id', input.cocktail_id)
    .order('position', { ascending: false })
    .limit(1)
  const existingRow = (existing ?? [])[0] as { position: number } | undefined
  const nextPosition = (existingRow?.position ?? 0) + 1

  const { error } = await db.from('cocktail_ingredients').insert({
    cocktail_id: input.cocktail_id,
    position: nextPosition,
    global_ingredient_id: globalId,
    workspace_ingredient_id: workspaceId,
    custom_name: null,
    amount: input.amount,
    unit: input.unit,
    notes: input.notes,
  })
  if (error) return { error: error.message }

  revalidatePath('/cocktails', 'layout')
  return { ok: true }
}
