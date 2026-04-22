'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { getCurrentWorkspace } from '@/lib/workspace/context'

export type SuggestResult = { ok: true } | { ok: false; error: string }

const ProductSchema = z.object({
  brand: z.string().trim().min(1, 'Brand required'),
  expression: z.string().trim().min(1, 'Expression required'),
  category: z.string().trim().min(1, 'Category required'),
  abv: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  origin: z.string().trim().max(120).optional().or(z.literal('')),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
})

const IngredientSchema = z.object({
  name: z.string().trim().min(1, 'Name required'),
  category: z.string().trim().optional().or(z.literal('')),
  default_unit: z.string().trim().max(16).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
})

function clean<T extends string | number | undefined>(v: T): T | null {
  if (v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v))) return null
  return v
}

export async function suggestProductAction(
  _: unknown,
  formData: FormData,
): Promise<SuggestResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = ProductSchema.safeParse({
    brand: formData.get('brand') ?? '',
    expression: formData.get('expression') ?? '',
    category: formData.get('category') ?? '',
    abv: formData.get('abv') ?? '',
    origin: formData.get('origin') ?? '',
    description: formData.get('description') ?? '',
    note: formData.get('note') ?? '',
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  }
  const d = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.from('catalog_suggestions').insert({
    kind: 'product',
    name: `${d.brand} — ${d.expression}`,
    brand: d.brand,
    expression: d.expression,
    category: d.category,
    abv: clean(d.abv as number | ''),
    origin: clean(d.origin as string | ''),
    description: clean(d.description as string | ''),
    note: clean(d.note as string | ''),
    suggested_by_user_id: user.id,
    suggested_from_workspace_id: workspace.id,
  } as never)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/products/new')
  return { ok: true }
}

export async function suggestIngredientAction(
  _: unknown,
  formData: FormData,
): Promise<SuggestResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = IngredientSchema.safeParse({
    name: formData.get('name') ?? '',
    category: formData.get('category') ?? '',
    default_unit: formData.get('default_unit') ?? '',
    note: formData.get('note') ?? '',
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  }
  const d = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.from('catalog_suggestions').insert({
    kind: 'ingredient',
    name: d.name,
    category: clean(d.category as string | ''),
    default_unit: clean(d.default_unit as string | ''),
    note: clean(d.note as string | ''),
    suggested_by_user_id: user.id,
    suggested_from_workspace_id: workspace.id,
  } as never)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/ingredients')
  return { ok: true }
}
