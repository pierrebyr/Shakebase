'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { slugify } from '@/lib/slug'
import { formatIngredientAmount } from '@/lib/cocktail/categories'
import { trackEvent } from '@/lib/activity/track'
import { ACTIVITY_KINDS } from '@/lib/activity/kinds'

const IngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  unit: z.string(),
  ingredient_id: z.string().uuid().nullable().optional(),
  ingredient_kind: z.enum(['global', 'workspace']).nullable().optional(),
})

const DraftSchema = z.object({
  name: z.string().min(2, 'Name required'),
  spirit: z.string(),
  base_product_id: z.string(),
  category: z.string(),
  glass: z.string(),
  creator_id: z.string(),
  color1: z.string(),
  color2: z.string(),
  photo_data_url: z.string().nullable(),
  photo_filename: z.string().nullable(),
  ingredients: z.array(IngredientSchema),
  method: z.string(),
  tasting_notes: z.string(),
  flavor: z.array(z.string()),
  status: z.enum(['draft', 'published']),
})

export type SubmitResult = { ok: true } | { ok: false; error: string }

// Decode a "data:image/png;base64,AAA..." URL into { bytes, contentType, ext }.
function decodeDataUrl(dataUrl: string): {
  bytes: Uint8Array
  contentType: string
  ext: string
} | null {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/)
  if (!match) return null
  const contentType = match[1]!
  const base64 = match[2]!
  const bytes = Uint8Array.from(Buffer.from(base64, 'base64'))
  const ext = contentType.split('/')[1] ?? 'bin'
  return { bytes, contentType, ext }
}

export async function submitCocktailDraft(_: unknown, formData: FormData): Promise<SubmitResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const rawPayload = formData.get('payload')
  if (typeof rawPayload !== 'string') return { ok: false, error: 'Missing payload' }

  let payload: unknown
  try {
    payload = JSON.parse(rawPayload)
  } catch {
    return { ok: false, error: 'Invalid payload JSON' }
  }

  const parsed = DraftSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid draft' }
  }
  const d = parsed.data

  const admin = createAdminClient()

  // Unique slug per workspace
  const baseSlug = slugify(d.name) || 'cocktail'
  let slug = baseSlug
  for (let attempt = 2; attempt < 50; attempt++) {
    const { data: exists } = await admin
      .from('cocktails')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('slug', slug)
      .maybeSingle()
    if (!exists) break
    slug = `${baseSlug}-${attempt}`
  }

  // Upload image if provided
  let image_url: string | null = null
  if (d.photo_data_url) {
    const decoded = decodeDataUrl(d.photo_data_url)
    if (decoded) {
      const path = `${workspace.id}/${slug}-${Date.now()}.${decoded.ext}`
      const { error: uploadError } = await admin.storage
        .from('cocktail-images')
        .upload(path, decoded.bytes, {
          contentType: decoded.contentType,
          upsert: false,
        })
      if (uploadError) {
        return { ok: false, error: `Image upload failed: ${uploadError.message}` }
      }
      const { data: publicUrl } = admin.storage.from('cocktail-images').getPublicUrl(path)
      image_url = publicUrl.publicUrl
    }
  }

  // Filter empty ingredients; compose "50 ml" / "3 dashes" / "Top up"
  const cleanIngredients = d.ingredients
    .map((i) => {
      const name = i.name.trim()
      const amount = i.amount.trim()
      const unit = i.unit.trim()
      const numeric = amount && !Number.isNaN(Number(amount)) ? Number(amount) : null
      return {
        name,
        amount_text: formatIngredientAmount(amount, unit),
        amount: numeric,
        unit,
        ingredient_id: i.ingredient_id ?? null,
        ingredient_kind: i.ingredient_kind ?? null,
      }
    })
    .filter((i) => i.name.length > 0)

  // Method: split by newline, trim, drop empty
  const methodSteps = d.method
    .split(/\r?\n/)
    .map((s, idx) => ({ step: idx + 1, text: s.trim() }))
    .filter((s) => s.text.length > 0)
    .map((s, idx) => ({ step: idx + 1, text: s.text }))

  const supabase = await createClient()

  // 1. Insert cocktail
  const { data: inserted, error: insertError } = await supabase
    .from('cocktails')
    .insert({
      workspace_id: workspace.id,
      slug,
      name: d.name,
      status: d.status,
      category: d.category || null,
      spirit_base: d.spirit || null,
      base_product_id: d.base_product_id || null,
      glass_type: d.glass || null,
      tasting_notes: d.tasting_notes || null,
      flavor_profile: d.flavor,
      orb_from: d.color1,
      orb_to: d.color2,
      image_url,
      method_steps: methodSteps,
      creator_id: d.creator_id || null,
      created_by: user.id,
    } as never)
    .select('id, slug')
    .single<{ id: string; slug: string }>()

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? 'Could not create cocktail' }
  }
  const cocktailId = inserted.id
  const cocktailSlug = inserted.slug

  await trackEvent({
    kind: ACTIVITY_KINDS.COCKTAIL_CREATE,
    target: { type: 'cocktail', id: cocktailId, label: d.name },
    metadata: { slug: cocktailSlug, category: d.category, spirit_base: d.spirit },
    dedupeWindowSec: 0,
  })

  // 2. Resolve any free-text names to global_ingredients (upsert), then
  //    batch-insert cocktail_ingredients with FK links (no custom_name).
  if (cleanIngredients.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Names that need upserting into global_ingredients (no selected FK)
    const unresolvedNames = [
      ...new Set(
        cleanIngredients
          .filter((i) => !i.ingredient_id)
          .map((i) => i.name),
      ),
    ]

    const globalByName = new Map<string, string>()
    if (unresolvedNames.length > 0) {
      const { inferIngredientCategory } = await import('@/lib/ingredient-slug')
      const payload = unresolvedNames.map((name) => ({
        name,
        category: inferIngredientCategory(name).toLowerCase().split(' ')[0],
      }))
      const { error: upsertErr } = await db
        .from('global_ingredients')
        .upsert(payload, { onConflict: 'name', ignoreDuplicates: false })
      if (upsertErr) {
        await supabase.from('cocktails').delete().eq('id', cocktailId)
        return { ok: false, error: `Ingredient upsert failed: ${upsertErr.message}` }
      }
      const { data: globals } = await db
        .from('global_ingredients')
        .select('id, name')
        .in('name', unresolvedNames)
      for (const g of (globals ?? []) as { id: string; name: string }[]) {
        globalByName.set(g.name, g.id)
      }
    }

    const rows = cleanIngredients.map((ing, idx) => {
      let globalId: string | null = null
      let workspaceId: string | null = null
      if (ing.ingredient_id && ing.ingredient_kind === 'workspace') {
        workspaceId = ing.ingredient_id
      } else if (ing.ingredient_id && ing.ingredient_kind === 'global') {
        globalId = ing.ingredient_id
      } else {
        globalId = globalByName.get(ing.name) ?? null
      }
      return {
        cocktail_id: cocktailId,
        position: idx + 1,
        global_ingredient_id: globalId,
        workspace_ingredient_id: workspaceId,
        custom_name: globalId || workspaceId ? null : ing.name,
        amount_text: ing.amount_text || null,
        amount: ing.amount,
        unit: ing.unit || null,
      }
    })
    const { error: ingError } = await db.from('cocktail_ingredients').insert(rows)
    if (ingError) {
      // Rollback
      await supabase.from('cocktails').delete().eq('id', cocktailId)
      return { ok: false, error: `Ingredient insert failed: ${ingError.message}` }
    }
  }

  // 3. Audit log
  await admin.from('audit_logs').insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: 'cocktail.create',
    target_type: 'cocktail',
    target_id: cocktailId,
    metadata: {
      slug,
      name: d.name,
      status: d.status,
      ingredients: cleanIngredients.length,
      method_steps: methodSteps.length,
      has_image: Boolean(image_url),
    },
  } as never)

  redirect(`/cocktails/${cocktailSlug}`)
}
