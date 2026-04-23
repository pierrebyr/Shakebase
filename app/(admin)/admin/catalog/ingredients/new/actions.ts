'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const IngredientCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name required'),
  category: z.string().trim().optional().or(z.literal('')),
  default_unit: z.string().trim().max(16).optional().or(z.literal('')),
  allergens: z.string().trim().optional().or(z.literal('')),
})

function emptyToNull<T>(v: T | '' | undefined): T | null {
  if (v === '' || v === undefined) return null
  return v as T
}

export async function createIngredientAction(formData: FormData): Promise<void> {
  const parsed = IngredientCreateSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    default_unit: formData.get('default_unit'),
    allergens: formData.get('allergens'),
  })
  if (!parsed.success) {
    redirect('/admin/catalog?tab=ingredients&action=ingredient_saved_err&reason=missing_name')
  }

  const { name, category, default_unit, allergens } = parsed.data
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  // Block exact duplicates.
  const { data: dupe } = await db
    .from('global_ingredients')
    .select('id')
    .ilike('name', name)
    .maybeSingle()
  if (dupe) {
    redirect('/admin/catalog?tab=ingredients&action=ingredient_saved_err&reason=duplicate_ingredient')
  }

  const allergenList =
    allergens && allergens.length > 0
      ? allergens
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean)
      : null

  const { data: inserted, error } = await db
    .from('global_ingredients')
    .insert({
      name,
      category: emptyToNull(category),
      default_unit: emptyToNull(default_unit),
      allergens: allergenList,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    redirect('/admin/catalog?tab=ingredients&action=ingredient_saved_err&reason=insert_failed')
  }

  revalidatePath('/admin/catalog')
  redirect(`/admin/catalog/ingredients/${inserted.id}?saved=1`)
}
