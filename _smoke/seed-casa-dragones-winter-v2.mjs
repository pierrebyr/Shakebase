// Seed the 5 cocktails from the Winter Craft Cocktails PDF that aren't yet
// in the Casa Dragones workspace:
//   - Crimson          (Fabiola Padilla · Casa Dragones Reposado)
//   - Mountain Leaf    (Casa Dragones Blanco)
//   - Honey Sparkle    (Casa Dragones Blanco)
//   - Dragones Sunset  (Casa Dragones Blanco)
//   - Manzana Confitada (Casa Dragones Blanco)
//
// Also ensures "Casa Dragones Reposado" (plain, not Mizunara) exists in the
// global catalog — it's referenced by Crimson.
//
// Idempotent: deletes existing rows by slug before insert.
// Run: node --env-file=.env.local _smoke/seed-casa-dragones-winter-v2.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── 1. Workspace ─────────────────────────────────────────────────────
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

// ─── 2. Ensure Casa Dragones Reposado product exists ─────────────────
const { data: reposadoExisting } = await admin
  .from('global_products')
  .select('id')
  .eq('brand', 'Casa Dragones')
  .eq('expression', 'Reposado')
  .maybeSingle()

let reposadoId = reposadoExisting?.id
if (!reposadoId) {
  const { data: inserted, error } = await admin
    .from('global_products')
    .insert({
      brand: 'Casa Dragones',
      expression: 'Reposado',
      category: 'Tequila',
      abv: 40.0,
      origin: 'Tequila, Jalisco, Mexico',
      description:
        '100% Blue Agave tequila, rested in American oak for a balanced, refined reposado.',
    })
    .select('id')
    .single()
  if (error || !inserted) {
    console.error('! product insert failed for Reposado:', error?.message)
    process.exit(1)
  }
  reposadoId = inserted.id
  console.log('+ product Casa Dragones Reposado')
} else {
  console.log('· product Casa Dragones Reposado exists')
}

const { data: blanco } = await admin
  .from('global_products')
  .select('id')
  .eq('brand', 'Casa Dragones')
  .eq('expression', 'Blanco')
  .maybeSingle()
const blancoId = blanco?.id

// ─── 3. Fabiola Padilla creator id ───────────────────────────────────
const { data: fabiola } = await admin
  .from('creators')
  .select('id')
  .eq('workspace_id', ws.id)
  .ilike('name', 'Fabiola Padilla')
  .maybeSingle()
const fabiolaId = fabiola?.id ?? null

// ─── 4. Cocktails ────────────────────────────────────────────────────
const COCKTAILS = [
  {
    slug: 'crimson',
    name: 'Crimson',
    status: 'published',
    category: 'Sour',
    spirit_base: 'Tequila',
    base_product_id: reposadoId,
    glass_type: 'Old Fashioned',
    garnish: 'Red wine float over ice sphere',
    tasting_notes:
      "Fabiola Padilla's refreshing, well-balanced mix — reposado tequila, bright yellow lemon, spicy ginger, finished with a refined red wine float for depth and drama.",
    flavor_profile: ['Fruity', 'Spicy', 'Balanced'],
    season: ['Winter'],
    orb_from: '#e8b68a',
    orb_to: '#7a2c2c',
    creator_id: fabiolaId,
    featured: true,
    ingredients: [
      { name: 'Casa Dragones Reposado', amount_text: '2 oz', amount: 60, unit: 'ml' },
      { name: 'Yellow lemon juice', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Ginger syrup', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      {
        name: 'Dry red wine',
        amount_text: '½ oz',
        amount: 15,
        unit: 'ml',
        notes: 'Zinfandel, Syrah or Malbec',
      },
    ],
    method: [
      'Shake all ingredients except the red wine with ice for 15 seconds.',
      'Double strain over a 6 cm ice sphere in an old-fashioned glass.',
      'Slowly float the red wine using the back of a bar spoon.',
    ],
  },
  {
    slug: 'mountain-leaf',
    name: 'Mountain Leaf',
    status: 'published',
    category: 'Margarita',
    spirit_base: 'Tequila',
    base_product_id: blancoId,
    glass_type: 'Coupe',
    garnish: 'Arugula leaf',
    tasting_notes:
      'An alpine twist on the traditional Margarita, marrying the peppery notes of arugula with the spiced notes of Tequila Casa Dragones Blanco.',
    flavor_profile: ['Herbal', 'Peppery', 'Citrus'],
    season: ['Winter'],
    orb_from: '#f2e9c8',
    orb_to: '#8ca25b',
    creator_id: null,
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      { name: 'Green Chartreuse', amount_text: '¼ oz', amount: 7.5, unit: 'ml' },
      { name: 'Lime juice', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Agave syrup', amount_text: '¼ oz', amount: 7.5, unit: 'ml' },
      { name: 'Arugula leaf', amount_text: '1 large', amount: 1, unit: 'pc' },
    ],
    method: [
      'Shake with ice and fine strain into a chilled coupe.',
      'Garnish with an arugula leaf.',
    ],
  },
  {
    slug: 'honey-sparkle',
    name: 'Honey Sparkle',
    status: 'published',
    category: 'Sparkling',
    spirit_base: 'Tequila',
    base_product_id: blancoId,
    glass_type: 'Coupe',
    garnish: 'None',
    tasting_notes:
      'A refreshing riff on the classic Airmail. Honey, Suze apéritif, Champagne and Casa Dragones Blanco — an original way to toast the New Year.',
    flavor_profile: ['Floral', 'Bitter', 'Sparkling'],
    season: ['Winter'],
    orb_from: '#fdf2c5',
    orb_to: '#e3b64e',
    creator_id: null,
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      { name: 'Lime juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Honey syrup (2:1)', amount_text: '¼ oz', amount: 7.5, unit: 'ml' },
      { name: 'Suze apéritif', amount_text: '¼ tsp', amount: 1.25, unit: 'ml' },
      {
        name: 'Pierre Peters Champagne',
        amount_text: '1 oz top',
        amount: 30,
        unit: 'ml',
        notes: 'Top with Champagne — do not shake.',
      },
    ],
    method: [
      'Shake all ingredients except the Champagne with ice and fine strain into a chilled coupe.',
      'Top with 1 oz Pierre Peters Champagne.',
      'No garnish.',
    ],
  },
  {
    slug: 'dragones-sunset',
    name: 'Dragones Sunset',
    status: 'published',
    category: 'Sour',
    spirit_base: 'Tequila',
    base_product_id: blancoId,
    glass_type: 'Coupe',
    garnish: 'None',
    tasting_notes:
      'Orange juice, Chartreuse and Casa Dragones Blanco — capturing the gold and russet hues of winter sunsets in a silky, egg-white sour.',
    flavor_profile: ['Fruity', 'Citrus', 'Herbal'],
    season: ['Winter'],
    orb_from: '#ffd38a',
    orb_to: '#d46a2a',
    creator_id: null,
    featured: true,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1¾ oz', amount: 52, unit: 'ml' },
      { name: 'Yellow Chartreuse', amount_text: '¼ oz', amount: 7.5, unit: 'ml' },
      { name: 'Carrot juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Orange juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Egg white', amount_text: '1', amount: 1, unit: 'pc' },
    ],
    method: [
      'Dry shake all ingredients without ice.',
      'Shake again with ice and fine strain into a chilled coupe.',
      'No garnish.',
    ],
  },
  {
    slug: 'manzana-confitada',
    name: 'Manzana Confitada',
    status: 'published',
    category: 'Sour',
    spirit_base: 'Tequila',
    base_product_id: blancoId,
    glass_type: 'Coupe',
    garnish: 'Grated nutmeg',
    tasting_notes:
      'Holiday flavors come to life — a sherry and cinnamon-spiced cocktail crafted exclusively with Tequila Casa Dragones Blanco.',
    flavor_profile: ['Fruity', 'Spicy', 'Sherry'],
    season: ['Winter'],
    orb_from: '#f8d79a',
    orb_to: '#b87033',
    creator_id: null,
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      { name: 'Cloudy apple cider', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Pedro Ximénez sherry', amount_text: '¼ oz', amount: 7.5, unit: 'ml' },
      { name: 'Becherovka', amount_text: '¼ oz', amount: 7.5, unit: 'ml' },
    ],
    method: [
      'Shake with ice and fine strain into a chilled coupe.',
      'Garnish with grated nutmeg.',
    ],
  },
]

// ─── 5. Idempotent re-insert ─────────────────────────────────────────
const slugs = COCKTAILS.map((c) => c.slug)
const { data: existing } = await admin
  .from('cocktails')
  .select('id, slug')
  .eq('workspace_id', ws.id)
  .in('slug', slugs)
if (existing && existing.length > 0) {
  console.log(`→ removing ${existing.length} existing rows for re-seed`)
  const ids = existing.map((r) => r.id)
  await admin.from('cocktail_ingredients').delete().in('cocktail_id', ids)
  await admin.from('cocktails').delete().in('id', ids)
}

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
      base_product_id: c.base_product_id,
      glass_type: c.glass_type,
      garnish: c.garnish,
      tasting_notes: c.tasting_notes,
      flavor_profile: c.flavor_profile,
      season: c.season,
      orb_from: c.orb_from,
      orb_to: c.orb_to,
      method_steps: methodSteps,
      creator_id: c.creator_id,
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

  console.log(`+ ${c.name} (${c.ingredients.length} ing · ${c.method.length} steps)`)
}

console.log('\n✓ done')
