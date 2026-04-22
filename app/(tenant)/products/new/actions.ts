'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'

const AddSchema = z.object({
  global_product_id: z.string().uuid(),
  stock: z.coerce.number().int().min(0).optional().nullable(),
  par: z.coerce.number().int().min(0).optional().nullable(),
  cost_cents: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().optional(),
})

export type AddProductResult = { ok: true } | { ok: false; error: string }

export async function addProductAction(_: unknown, formData: FormData): Promise<AddProductResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = AddSchema.safeParse({
    global_product_id: formData.get('global_product_id'),
    stock: formData.get('stock') || null,
    par: formData.get('par') || null,
    cost_cents: formData.get('cost_cents') || null,
    notes: String(formData.get('notes') ?? ''),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_products')
    .insert({
      workspace_id: workspace.id,
      global_product_id: parsed.data.global_product_id,
      stock: parsed.data.stock ?? null,
      par: parsed.data.par ?? null,
      cost_cents: parsed.data.cost_cents ?? null,
      notes: parsed.data.notes || null,
    } as never)

  if (error) {
    // Unique violation — they already added this product.
    if (error.code === '23505') {
      return { ok: false, error: 'This bottle is already in your catalog.' }
    }
    return { ok: false, error: error.message }
  }

  const admin = createAdminClient()
  await admin.from('audit_logs').insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: 'product.add',
    target_type: 'workspace_product',
    target_id: parsed.data.global_product_id,
  } as never)

  redirect('/products')
}
