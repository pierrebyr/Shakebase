'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const ProductCreateSchema = z.object({
  brand: z.string().trim().min(1, 'Brand required'),
  expression: z.string().trim().min(1, 'Expression required'),
  category: z.string().trim().min(1, 'Category required'),
  abv: z
    .union([z.coerce.number().min(0).max(100), z.literal(''), z.undefined()])
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
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a 6-digit hex')
    .optional()
    .or(z.literal('')),
})

function emptyToNull<T>(v: T | '' | undefined): T | null {
  if (v === '' || v === undefined) return null
  return v as T
}

export async function createProductAction(formData: FormData): Promise<void> {
  const parsed = ProductCreateSchema.safeParse({
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
    redirect('/admin/catalog?action=product_saved_err&reason=missing_product_fields')
  }

  const p = parsed.data
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  // Block exact duplicates (same brand + expression).
  const { data: dupe } = await db
    .from('global_products')
    .select('id')
    .ilike('brand', p.brand)
    .ilike('expression', p.expression)
    .maybeSingle()
  if (dupe) {
    redirect('/admin/catalog?action=product_saved_err&reason=duplicate_product')
  }

  const { data: inserted, error } = await db
    .from('global_products')
    .insert({
      brand: p.brand,
      expression: p.expression,
      category: p.category,
      abv: emptyToNull(p.abv),
      origin: emptyToNull(p.origin),
      tagline: emptyToNull(p.tagline),
      description: emptyToNull(p.description),
      tasting_notes: emptyToNull(p.tasting_notes),
      volume_ml: emptyToNull(p.volume_ml),
      image_url: emptyToNull(p.image_url),
      color_hex: emptyToNull(p.color_hex),
    })
    .select('id')
    .single()

  if (error || !inserted) {
    redirect('/admin/catalog?action=product_saved_err&reason=insert_failed')
  }

  revalidatePath('/admin/catalog')
  redirect(`/admin/catalog/products/${inserted.id}?saved=1`)
}
