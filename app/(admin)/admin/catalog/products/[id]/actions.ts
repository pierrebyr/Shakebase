'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const ProductPatchSchema = z.object({
  id: z.string().uuid(),
  brand: z.string().trim().min(1, 'Brand required'),
  expression: z.string().trim().min(1, 'Expression required'),
  category: z.string().trim().min(1, 'Category required'),
  abv: z
    .union([
      z.coerce.number().min(0).max(100),
      z.literal(''),
      z.undefined(),
    ])
    .optional(),
  origin: z.string().trim().max(120).optional().or(z.literal('')),
  tagline: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  tasting_notes: z.string().trim().max(1000).optional().or(z.literal('')),
  volume_ml: z
    .union([z.coerce.number().int().min(0).max(5000), z.literal(''), z.undefined()])
    .optional(),
  image_url: z.string().trim().max(500).optional().or(z.literal('')),
  color_hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a 6-digit hex like #aabbcc')
    .optional()
    .or(z.literal('')),
})

function emptyToNull<T>(v: T | '' | undefined): T | null {
  if (v === '' || v === undefined) return null
  return v as T
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const parsed = ProductPatchSchema.safeParse({
    id: formData.get('id'),
    brand: formData.get('brand'),
    expression: formData.get('expression'),
    category: formData.get('category'),
    abv: formData.get('abv'),
    origin: formData.get('origin'),
    tagline: formData.get('tagline'),
    description: formData.get('description'),
    tasting_notes: formData.get('tasting_notes'),
    volume_ml: formData.get('volume_ml'),
    image_url: formData.get('image_url'),
    color_hex: formData.get('color_hex'),
  })
  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.code === 'invalid_string' ? 'invalid_color' : 'missing_product_fields'
    redirect(`/admin/catalog?action=product_saved_err&reason=${reason}`)
  }

  const { id, ...patch } = parsed.data
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { error } = await db
    .from('global_products')
    .update({
      brand: patch.brand,
      expression: patch.expression,
      category: patch.category,
      abv: emptyToNull(patch.abv),
      origin: emptyToNull(patch.origin),
      tagline: emptyToNull(patch.tagline),
      description: emptyToNull(patch.description),
      tasting_notes: emptyToNull(patch.tasting_notes),
      volume_ml: emptyToNull(patch.volume_ml),
      image_url: emptyToNull(patch.image_url),
      color_hex: emptyToNull(patch.color_hex),
    })
    .eq('id', id)

  if (error) {
    redirect(`/admin/catalog?action=product_saved_err&reason=update_failed`)
  }

  revalidatePath('/admin/catalog')
  revalidatePath(`/admin/catalog/products/${id}`)
  redirect(`/admin/catalog/products/${id}?saved=1`)
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin/catalog?action=product_deleted_err&reason=missing_name')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  // Safety: block delete if any cocktail or workspace still references it.
  const [{ count: cocktailCount }, { count: workspaceCount }] = await Promise.all([
    db
      .from('cocktails')
      .select('id', { count: 'exact', head: true })
      .eq('base_product_id', id),
    db
      .from('workspace_products')
      .select('id', { count: 'exact', head: true })
      .eq('global_product_id', id),
  ])
  const refs = (cocktailCount ?? 0) + (workspaceCount ?? 0)
  if (refs > 0) {
    redirect(`/admin/catalog?action=product_deleted_err&reason=in_use`)
  }

  const { error } = await db.from('global_products').delete().eq('id', id)
  if (error) {
    redirect(`/admin/catalog?action=product_deleted_err&reason=delete_failed`)
  }

  revalidatePath('/admin/catalog')
  redirect('/admin/catalog?action=product_deleted')
}
