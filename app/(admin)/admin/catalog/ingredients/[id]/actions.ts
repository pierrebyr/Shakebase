'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const IngredientPatchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Name required'),
  category: z.string().trim().optional().or(z.literal('')),
  default_unit: z.string().trim().max(16).optional().or(z.literal('')),
  allergens: z.string().trim().optional().or(z.literal('')),
})

function emptyToNull<T>(v: T | '' | undefined): T | null {
  if (v === '' || v === undefined) return null
  return v as T
}

export async function updateIngredientAction(formData: FormData): Promise<void> {
  const parsed = IngredientPatchSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    category: formData.get('category'),
    default_unit: formData.get('default_unit'),
    allergens: formData.get('allergens'),
  })
  if (!parsed.success) {
    redirect('/admin/catalog?tab=ingredients&action=ingredient_saved_err&reason=missing_name')
  }

  const { id, name, category, default_unit, allergens } = parsed.data
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const allergenList =
    allergens && allergens.length > 0
      ? allergens
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean)
      : null

  const { error } = await db
    .from('global_ingredients')
    .update({
      name,
      category: emptyToNull(category),
      default_unit: emptyToNull(default_unit),
      allergens: allergenList,
    })
    .eq('id', id)

  if (error) {
    redirect('/admin/catalog?tab=ingredients&action=ingredient_saved_err&reason=update_failed')
  }

  revalidatePath('/admin/catalog')
  revalidatePath(`/admin/catalog/ingredients/${id}`)
  redirect(`/admin/catalog/ingredients/${id}?saved=1`)
}

export async function deleteIngredientAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin/catalog?tab=ingredients&action=ingredient_deleted_err&reason=missing_name')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  // Block delete when the ingredient is still referenced in any recipe.
  const { count: refCount } = await db
    .from('cocktail_ingredients')
    .select('id', { count: 'exact', head: true })
    .eq('global_ingredient_id', id)

  if ((refCount ?? 0) > 0) {
    redirect('/admin/catalog?tab=ingredients&action=ingredient_deleted_err&reason=in_use')
  }

  const { error } = await db.from('global_ingredients').delete().eq('id', id)
  if (error) {
    redirect('/admin/catalog?tab=ingredients&action=ingredient_deleted_err&reason=delete_failed')
  }

  revalidatePath('/admin/catalog')
  redirect('/admin/catalog?tab=ingredients&action=ingredient_deleted')
}
