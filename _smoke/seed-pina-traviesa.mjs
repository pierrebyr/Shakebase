// Fix: Piña Traviesa is a distinct cocktail (Eli Martínez · Rubra), not Tropicoqueta.
// 1. Detach the pina-traviesa image from Tropicoqueta (leave the recipe).
// 2. Seed Piña Traviesa with the pina-traviesa image and creator link.
//
// Piña Traviesa ingredients from user (no amounts provided — using sensible defaults
// for a stirred 200 Copas + pineapple + Yellow Chartreuse + Angostura build):
//   - 2 oz Casa Dragones 200 Copas
//   - 1 oz Pineapple juice
//   - ½ oz Yellow Chartreuse
//   - 2 dashes Angostura Bitters
//
// Idempotent on slug.
// Run: node --env-file=.env.local _smoke/seed-pina-traviesa.mjs

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const IMG =
  '/Users/pierrebouyer/Documents/Casa Dragones/Work/December 2025/121525 - 200 Copas Cocktails/casa-dragones-pina-traviesa-200-copas-cocktail-PB.jpg'

// ─── 1. Workspace + 200 Copas product ────────────────────────────────
const { data: ws } = await admin
  .from('workspaces')
  .select('id, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!ws) {
  console.error('No workspace "casa-dragones"')
  process.exit(1)
}

const { data: copas } = await admin
  .from('global_products')
  .select('id')
  .eq('brand', 'Casa Dragones')
  .eq('expression', '200 Copas')
  .maybeSingle()
if (!copas) {
  console.error('No 200 Copas product')
  process.exit(1)
}

// ─── 2. Detach image from Tropicoqueta ───────────────────────────────
const { data: tropi } = await admin
  .from('cocktails')
  .select('id, image_url')
  .eq('workspace_id', ws.id)
  .eq('slug', 'tropicoqueta')
  .maybeSingle()
if (tropi && tropi.image_url) {
  const prevPath = tropi.image_url.includes('/cocktail-images/')
    ? tropi.image_url.split('/cocktail-images/')[1]
    : null
  if (prevPath) await admin.storage.from('cocktail-images').remove([prevPath]).catch(() => {})
  await admin.from('cocktails').update({ image_url: null, images: [] }).eq('id', tropi.id)
  console.log('· Tropicoqueta image detached')
}

// ─── 3. Find or create Eli Martínez (Rubra) creator ──────────────────
let creatorId = null
const { data: existingCreator } = await admin
  .from('creators')
  .select('id')
  .eq('workspace_id', ws.id)
  .ilike('name', 'Eli Martínez')
  .maybeSingle()
if (existingCreator) {
  creatorId = existingCreator.id
  console.log('· Eli Martínez creator exists')
} else {
  const slug = 'eli-martinez'
  const { data: inserted, error } = await admin
    .from('creators')
    .insert({
      workspace_id: ws.id,
      slug,
      name: 'Eli Martínez',
      role: 'Bartender',
      city: 'Mexico City',
      country: 'Mexico',
      bio: 'Bartender at Rubra, Mexico City — part of the 200 Copas by Casa Dragones cocktail collaboration.',
    })
    .select('id')
    .single()
  if (error || !inserted) {
    console.error('! creator insert failed:', error?.message)
  } else {
    creatorId = inserted.id
    console.log('+ Eli Martínez creator created')
  }
}

// ─── 4. Seed Piña Traviesa ───────────────────────────────────────────
const slug = 'pina-traviesa'
const { data: existing } = await admin
  .from('cocktails')
  .select('id, image_url')
  .eq('workspace_id', ws.id)
  .eq('slug', slug)
  .maybeSingle()
if (existing) {
  if (existing.image_url && existing.image_url.includes('/cocktail-images/')) {
    const prev = existing.image_url.split('/cocktail-images/')[1]
    if (prev) await admin.storage.from('cocktail-images').remove([prev]).catch(() => {})
  }
  await admin.from('cocktail_ingredients').delete().eq('cocktail_id', existing.id)
  await admin.from('cocktails').delete().eq('id', existing.id)
  console.log('· removed existing Piña Traviesa for re-seed')
}

const ingredients = [
  { name: 'Casa Dragones 200 Copas', amount_text: '2 oz', amount: 60, unit: 'ml', link_product: true },
  { name: 'Pineapple juice', amount_text: '1 oz', amount: 30, unit: 'ml' },
  { name: 'Yellow Chartreuse', amount_text: '½ oz', amount: 15, unit: 'ml' },
  { name: 'Angostura Bitters', amount_text: '2 dashes', amount: 1, unit: 'dash', notes: null },
]

const method = [
  'Combine all ingredients in a mixing glass with ice.',
  'Stir until well chilled and diluted, about 15 seconds.',
  'Strain over a single large cube in an old fashioned glass.',
  'Garnish with a pineapple leaf.',
]

const { data: cocktail, error: insertErr } = await admin
  .from('cocktails')
  .insert({
    workspace_id: ws.id,
    slug,
    name: 'Piña Traviesa',
    status: 'published',
    category: 'Old Fashioned',
    spirit_base: 'Tequila',
    base_product_id: copas.id,
    glass_type: 'Old Fashioned',
    garnish: 'Pineapple leaf',
    tasting_notes:
      "Eli Martínez's playful riff from Rubra: 200 Copas stirred with fresh pineapple, Yellow Chartreuse and Angostura. Tropical fruit meets herbal botanicals over a single big cube — spirit-forward, a little naughty.",
    flavor_profile: ['Tropical', 'Herbal', 'Spirit-forward'],
    season: ['Summer'],
    orb_from: '#f7e4a0',
    orb_to: '#c98b4a',
    method_steps: method.map((text, i) => ({ step: i + 1, text })),
    creator_id: creatorId,
    featured: true,
  })
  .select('id')
  .single()

if (insertErr || !cocktail) {
  console.error('! Piña Traviesa insert failed:', insertErr?.message)
  process.exit(1)
}

await admin.from('cocktail_ingredients').insert(
  ingredients.map((ing, idx) => ({
    cocktail_id: cocktail.id,
    position: idx + 1,
    custom_name: ing.name,
    global_product_id: ing.link_product ? copas.id : null,
    amount_text: ing.amount_text,
    amount: ing.amount,
    unit: ing.unit,
    notes: ing.notes ?? null,
  })),
)

// Upload image
const bytes = await readFile(IMG)
const path = `${ws.id}/${slug}-${Date.now()}.jpg`
const { error: upErr } = await admin.storage
  .from('cocktail-images')
  .upload(path, bytes, { contentType: 'image/jpeg', upsert: false })
if (upErr) {
  console.error('! image upload failed:', upErr.message)
} else {
  const { data: pub } = admin.storage.from('cocktail-images').getPublicUrl(path)
  await admin
    .from('cocktails')
    .update({ image_url: pub.publicUrl, images: [pub.publicUrl] })
    .eq('id', cocktail.id)
  console.log(`+ Piña Traviesa · ${ingredients.length} ing · ${method.length} steps · image ✓`)
}

console.log('\n✓ done')
