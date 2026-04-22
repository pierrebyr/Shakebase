'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'

const IngredientSchema = z.object({
  name: z.string().min(2, 'Name required'),
  category: z.string().optional(),
  default_unit: z.string().optional(),
})

export type AddIngredientResult = { ok: true } | { ok: false; error: string }

export async function addWorkspaceIngredient(
  _: unknown,
  formData: FormData,
): Promise<AddIngredientResult> {
  const parsed = IngredientSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim(),
    default_unit: String(formData.get('default_unit') ?? '').trim(),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }

  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_ingredients')
    .insert({
      workspace_id: workspace.id,
      name: parsed.data.name,
      category: parsed.data.category || null,
      default_unit: parsed.data.default_unit || 'ml',
    } as never)

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'This ingredient already exists in your pantry.' }
    return { ok: false, error: error.message }
  }

  revalidatePath('/ingredients')
  return { ok: true }
}
