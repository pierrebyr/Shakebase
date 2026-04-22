// Seed 3 new Casa Dragones 200 Copas cocktails + upload their hero images.
//   - Fuego y Pasión   (espresso / tonka / coconut — Nick & Nora)
//   - Tropicoqueta     (tropical — old fashioned over ice; image: piña-traviesa)
//   - Karol's Paloma   (milk-punch clarified + carbonated — highball)
//
// Idempotent: deletes existing rows by slug before insert.
// Run: node --env-file=.env.local _smoke/seed-200-copas-cocktails.mjs

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const IMG_ROOT =
  '/Users/pierrebouyer/Documents/Casa Dragones/Work/December 2025/121525 - 200 Copas Cocktails'

// ─── 1. Workspace + 200 Copas product ─────────────────────────────────
const { data: ws } = await admin
  .from('workspaces')
  .select('id, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!ws) {
  console.error('No workspace "casa-dragones"')
  process.exit(1)
}
console.log(`→ workspace ${ws.name}`)

const { data: copas } = await admin
  .from('global_products')
  .select('id, expression')
  .eq('brand', 'Casa Dragones')
  .eq('expression', '200 Copas')
  .maybeSingle()
if (!copas) {
  console.error('No global_product "Casa Dragones 200 Copas"')
  process.exit(1)
}
console.log(`→ product ${copas.expression}`)

// ─── 2. Cocktail definitions ──────────────────────────────────────────
const COCKTAILS = [
  {
    slug: 'fuego-y-pasion',
    name: 'Fuego y Pasión',
    status: 'published',
    category: 'After Dinner',
    spirit_base: 'Tequila',
    glass_type: 'Nick & Nora',
    garnish: 'None',
    tasting_notes:
      'A velvety after-dinner sipper built on Casa Dragones 200 Copas and fresh espresso. Tonka-bean syrup brings warm vanilla and almond, while coconut liqueur and a whisper of coffee liqueur round out a deep, silky finish.',
    flavor_profile: ['Coffee', 'Rich', 'Nutty'],
    season: ['Winter'],
    orb_from: '#d9b08a',
    orb_to: '#3a2418',
    featured: true,
    image_file: `${IMG_ROOT}/casa-dragones-fuego-y-pasion-200-copas-cocktail-PB.jpg`,
    ingredients: [
      { name: 'Casa Dragones 200 Copas', amount_text: '1 oz', amount: 30, unit: 'ml', link_product: true },
      { name: 'Espresso', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      { name: 'Giffard Coconut Liqueur', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Tonka bean syrup (1:1)', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Coffee liqueur', amount_text: '¼ oz', amount: 7.5, unit: 'ml' },
    ],
    method: [
      'Combine all ingredients in a shaker tin with ice.',
      'Hard shake for 10–12 seconds.',
      'Double strain into a chilled Nick & Nora glass.',
    ],
  },
  {
    slug: 'tropicoqueta',
    name: 'Tropicoqueta',
    status: 'published',
    category: 'Tropical',
    spirit_base: 'Tequila',
    glass_type: 'Old Fashioned',
    garnish: 'Pineapple leaf',
    tasting_notes:
      'A sun-drenched tropical long drink layering Casa Dragones 200 Copas with coconut, banana, guava, pineapple and coconut water. Bright yellow lemon keeps it sharp and endlessly refreshing over ice.',
    flavor_profile: ['Tropical', 'Fruity', 'Refreshing'],
    season: ['Summer'],
    orb_from: '#fff4c4',
    orb_to: '#f0a244',
    featured: true,
    image_file: `${IMG_ROOT}/casa-dragones-pina-traviesa-200-copas-cocktail-PB.jpg`,
    ingredients: [
      { name: 'Casa Dragones 200 Copas', amount_text: '1½ oz', amount: 45, unit: 'ml', link_product: true },
      { name: 'Giffard Coconut Liqueur', amount_text: '¼ oz', amount: 7.5, unit: 'ml' },
      { name: 'Giffard Banana Liqueur', amount_text: '¼ oz', amount: 7.5, unit: 'ml' },
      { name: 'Real Guava purée', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Pineapple juice', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Yellow lemon juice', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Coconut water', amount_text: '1 oz', amount: 30, unit: 'ml' },
    ],
    method: [
      'Combine all ingredients in a shaker tin with ice.',
      'Hard shake for 10–12 seconds.',
      'Double strain over fresh ice into an old fashioned glass.',
      'Garnish with a pineapple leaf.',
    ],
  },
  {
    slug: 'karols-paloma',
    name: "Karol's Paloma",
    status: 'published',
    category: 'Paloma',
    spirit_base: 'Tequila',
    glass_type: 'Highball',
    garnish: 'Cempasúchil salt rim + grapefruit slice',
    tasting_notes:
      "A signature collab Paloma: Casa Dragones 200 Copas, grapefruit, orange and lime clarified through the milk-punch method, then carbonated for a crystal-clear, effervescent finish. A cempasúchil-salt rim nods to Karol G's Mexican roots.",
    flavor_profile: ['Citrus', 'Refreshing', 'Effervescent'],
    season: ['Summer', 'Spring'],
    orb_from: '#ffd9d0',
    orb_to: '#e88d85',
    featured: true,
    image_file: `${IMG_ROOT}/casa-dragones-karols-paloma-200-copas-cocktail-PB.jpg`,
    ingredients: [
      { name: 'Casa Dragones 200 Copas', amount_text: '1½ oz', amount: 45, unit: 'ml', link_product: true },
      { name: 'Grapefruit juice', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      { name: 'Orange juice', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Lime juice', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Simple syrup', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Cointreau', amount_text: '1 barspoon', amount: 5, unit: 'ml' },
      { name: 'Whole milk', amount_text: '1 oz', amount: 30, unit: 'ml', notes: 'for clarification' },
      { name: 'Cempasúchil salt', amount_text: '1 unit', amount: 1, unit: 'pc', notes: 'rim' },
    ],
    method: [
      'Combine all ingredients except the milk in a mixing vessel.',
      'Add the milk and stir gently to trigger the milk-punch clarification.',
      'Let the curds form, then filter through cloth until the liquid runs crystal clear.',
      'Carbonate the clarified mix with CO₂.',
      'Rim a chilled highball glass with cempasúchil salt and fill with ice.',
      'Pour the carbonated Paloma over the ice and garnish with a grapefruit slice.',
    ],
  },
]

// ─── 3. Idempotent re-insert ──────────────────────────────────────────
const slugs = COCKTAILS.map((c) => c.slug)
const { data: existing } = await admin
  .from('cocktails')
  .select('id, slug, image_url')
  .eq('workspace_id', ws.id)
  .in('slug', slugs)
if (existing && existing.length > 0) {
  console.log(`→ removing ${existing.length} existing rows for re-seed`)
  const ids = existing.map((r) => r.id)
  // clean up previously uploaded images too
  for (const row of existing) {
    if (row.image_url && row.image_url.includes('/cocktail-images/')) {
      const prevPath = row.image_url.split('/cocktail-images/')[1]
      if (prevPath) await admin.storage.from('cocktail-images').remove([prevPath]).catch(() => {})
    }
  }
  await admin.from('cocktail_ingredients').delete().in('cocktail_id', ids)
  await admin.from('cocktails').delete().in('id', ids)
}

// ─── 4. Insert cocktails + ingredients + upload images ───────────────
for (const c of COCKTAILS) {
  const methodSteps = c.method.map((text, i) => ({ step: i + 1, text }))

  const { data: inserted, error: insertErr } = await admin
    .from('cocktails')
    .insert({
      workspace_id: ws.id,
      slug: c.slug,
      name: c.name,
      status: c.status,
      category: c.category,
      spirit_base: c.spirit_base,
      base_product_id: copas.id,
      glass_type: c.glass_type,
      garnish: c.garnish,
      tasting_notes: c.tasting_notes,
      flavor_profile: c.flavor_profile,
      season: c.season,
      orb_from: c.orb_from,
      orb_to: c.orb_to,
      method_steps: methodSteps,
      featured: c.featured,
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    console.error(`! insert failed for ${c.slug}:`, insertErr?.message)
    continue
  }

  const ingRows = c.ingredients.map((ing, idx) => ({
    cocktail_id: inserted.id,
    position: idx + 1,
    custom_name: ing.name,
    global_product_id: ing.link_product ? copas.id : null,
    amount_text: ing.amount_text,
    amount: ing.amount,
    unit: ing.unit,
    notes: ing.notes ?? null,
  }))

  const { error: ingErr } = await admin.from('cocktail_ingredients').insert(ingRows)
  if (ingErr) {
    console.error(`! ingredient insert failed for ${c.slug}:`, ingErr.message)
    continue
  }

  // Upload image
  let imageUrl = null
  try {
    const bytes = await readFile(c.image_file)
    const path = `${ws.id}/${c.slug}-${Date.now()}.jpg`
    const { error: upErr } = await admin.storage
      .from('cocktail-images')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false })
    if (upErr) {
      console.error(`! image upload failed for ${c.slug}:`, upErr.message)
    } else {
      const { data: pub } = admin.storage.from('cocktail-images').getPublicUrl(path)
      imageUrl = pub.publicUrl
      await admin
        .from('cocktails')
        .update({ image_url: imageUrl, images: [imageUrl] })
        .eq('id', inserted.id)
    }
  } catch (e) {
    console.error(`! image read failed for ${c.slug}:`, e.message)
  }

  console.log(
    `+ ${c.name} · ${c.ingredients.length} ing · ${c.method.length} steps${imageUrl ? ' · image ✓' : ''}`,
  )
}

console.log('\n✓ done')
