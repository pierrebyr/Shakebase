'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { SPIRIT_BASES } from '@/lib/cocktail/categories'

export type MutationResult = { ok: true } | { ok: false; error: string }

const BasicsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Name required'),
  category: z.string().optional(),
  spirit_base: z.enum(SPIRIT_BASES).or(z.literal('')).optional(),
  glass_type: z.string().optional(),
  garnish: z.string().optional(),
  tasting_notes: z.string().optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  featured: z.string().optional(),
  pinned: z.string().optional(),
})

export async function updateBasicsAction(_: unknown, formData: FormData): Promise<MutationResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = BasicsSchema.safeParse({
    id: formData.get('id'),
    name: String(formData.get('name') ?? '').trim(),
    category: String(formData.get('category') ?? ''),
    spirit_base: String(formData.get('spirit_base') ?? ''),
    glass_type: String(formData.get('glass_type') ?? ''),
    garnish: String(formData.get('garnish') ?? ''),
    tasting_notes: String(formData.get('tasting_notes') ?? ''),
    status: (formData.get('status') as 'draft' | 'review' | 'published' | 'archived') ?? 'draft',
    featured: String(formData.get('featured') ?? ''),
    pinned: String(formData.get('pinned') ?? ''),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  const { id, ...patch } = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from('cocktails')
    .update({
      name: patch.name,
      category: patch.category || null,
      spirit_base: patch.spirit_base || null,
      glass_type: patch.glass_type || null,
      garnish: patch.garnish || null,
      tasting_notes: patch.tasting_notes || null,
      status: patch.status,
      featured: patch.featured === 'on',
      pinned: patch.pinned === 'on',
    } as never)
    .eq('id', id)
    .eq('workspace_id', workspace.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/cocktails/${id}`)
  revalidatePath('/cocktails')
  // Sidebar is rendered from the tenant layout — flush it so a pin toggle
  // shows up (or disappears) immediately.
  revalidatePath('/', 'layout')
  return { ok: true }
}

const MethodSchema = z.object({
  id: z.string().uuid(),
  steps: z.string(), // JSON-encoded array
})

export async function updateMethodAction(_: unknown, formData: FormData): Promise<MutationResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = MethodSchema.safeParse({
    id: formData.get('id'),
    steps: formData.get('steps'),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid form' }

  let steps: { step: number; text: string }[] = []
  try {
    const raw = JSON.parse(parsed.data.steps) as unknown
    if (!Array.isArray(raw)) throw new Error('Not an array')
    steps = raw
      .filter((s): s is { step: number; text: string } =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as { text?: unknown }).text === 'string',
      )
      .map((s, i) => ({ step: i + 1, text: s.text }))
      .filter((s) => s.text.trim().length > 0)
  } catch {
    return { ok: false, error: 'Invalid steps payload' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('cocktails')
    .update({ method_steps: steps } as never)
    .eq('id', parsed.data.id)
    .eq('workspace_id', workspace.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/cocktails/${parsed.data.id}`)
  return { ok: true }
}

const AddIngredientSchema = z.object({
  cocktail_id: z.string().uuid(),
  kind: z.enum(['global_ingredient', 'global_product', 'workspace_ingredient', 'custom']),
  source_id: z.string().uuid().optional().nullable(),
  custom_name: z.string().optional(),
  amount: z.coerce.number().optional().nullable(),
  unit: z.string().optional(),
  notes: z.string().optional(),
})

export async function addIngredientAction(_: unknown, formData: FormData): Promise<MutationResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = AddIngredientSchema.safeParse({
    cocktail_id: formData.get('cocktail_id'),
    kind: formData.get('kind'),
    source_id: formData.get('source_id') || null,
    custom_name: formData.get('custom_name') || '',
    amount: formData.get('amount') || null,
    unit: formData.get('unit') || '',
    notes: formData.get('notes') || '',
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  const input = parsed.data

  // Need at least one source
  if (input.kind !== 'custom' && !input.source_id) {
    return { ok: false, error: 'Select an ingredient or product' }
  }
  if (input.kind === 'custom' && !input.custom_name) {
    return { ok: false, error: 'Custom name required' }
  }

  // Verify ownership of the cocktail (defense-in-depth; RLS also enforces)
  const supabase = await createClient()
  const { data: cocktail } = await supabase
    .from('cocktails')
    .select('id')
    .eq('id', input.cocktail_id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!cocktail) return { ok: false, error: 'Cocktail not found' }

  // Get next position
  const { data: existing } = await supabase
    .from('cocktail_ingredients')
    .select('position')
    .eq('cocktail_id', input.cocktail_id)
    .order('position', { ascending: false })
    .limit(1)
  const existingRow = (existing ?? [])[0] as { position: number } | undefined
  const nextPosition = (existingRow?.position ?? 0) + 1

  const row = {
    cocktail_id: input.cocktail_id,
    position: nextPosition,
    global_ingredient_id: input.kind === 'global_ingredient' ? input.source_id : null,
    global_product_id: input.kind === 'global_product' ? input.source_id : null,
    workspace_ingredient_id: input.kind === 'workspace_ingredient' ? input.source_id : null,
    custom_name: input.kind === 'custom' ? input.custom_name : null,
    amount: input.amount ?? null,
    unit: input.unit || null,
    notes: input.notes || null,
  }

  const { error } = await supabase.from('cocktail_ingredients').insert(row as never)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/cocktails/${input.cocktail_id}`)
  revalidatePath(`/cocktails/${input.cocktail_id}/edit`)
  return { ok: true }
}

const RemoveIngredientSchema = z.object({
  id: z.string().uuid(),
  cocktail_id: z.string().uuid(),
})

export async function removeIngredientAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()

  const parsed = RemoveIngredientSchema.safeParse({
    id: formData.get('id'),
    cocktail_id: formData.get('cocktail_id'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  const admin = createAdminClient()
  const { data: cocktail } = await admin
    .from('cocktails')
    .select('id')
    .eq('id', parsed.data.cocktail_id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!cocktail) throw new Error('Cocktail not found')

  const supabase = await createClient()
  const { error } = await supabase.from('cocktail_ingredients').delete().eq('id', parsed.data.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/cocktails/${parsed.data.cocktail_id}`)
  revalidatePath(`/cocktails/${parsed.data.cocktail_id}/edit`)
}

const DeleteCocktailSchema = z.object({ id: z.string().uuid() })

export async function deleteCocktailAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()

  const parsed = DeleteCocktailSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  const { error } = await supabase
    .from('cocktails')
    .delete()
    .eq('id', parsed.data.id)
    .eq('workspace_id', workspace.id)
  if (error) throw new Error(error.message)

  redirect('/cocktails')
}
