// Apply trusted recipes from the CDMX March 2025 docx to the 11 matching
// cocktails. The docx gives exact amounts + venue + glass + ice + garnish.
// Where the docx lists no Blanco pour (some recipes list only non-base
// ingredients), we keep a standard 45 ml Casa Dragones pour since these are
// Casa Dragones menu items.
//
// Run: node --env-file=.env.local _smoke/apply-docx.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const { data: products } = await admin.from('global_products').select('id, expression').eq('brand', 'Casa Dragones')
const pid = (expr) => products.find((p) => p.expression === expr)?.id

const FIXES = [
  {
    slug: 'don-t-push-meche',
    venue: 'Ticuchi',
    ingredients: [
      { amount_text: '45 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: null, name: 'Clarified passion fruit' },
      { amount_text: null, name: 'Vanilla' },
      { amount_text: null, name: 'Pedro Ximénez nectar' },
      { amount_text: null, name: 'Soda water' },
    ],
    glass_type: 'Highball',
    garnish: 'Kumquat or Ushuva (goldenberry)',
  },
  {
    slug: 'martini-16',
    venue: 'Ritz',
    ingredients: [
      { amount_text: '50 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '10 ml', name: 'Peach liqueur' },
      { amount_text: '22.5 ml', name: 'Cocchi Americano' },
      { amount_text: null, name: 'Martini 16 (vermouth)' },
    ],
    glass_type: 'Martini',
    method: [
      'Combine all ingredients in a mixing glass with ice.',
      'Stir until well chilled.',
      'Strain into a chilled martini glass.',
    ],
  },
  {
    slug: 'cadillac-margarita',
    venue: 'Dante',
    ingredients: [
      { amount_text: '45 ml', name: 'Casa Dragones Reposado Mizunara', product: 'Reposado Mizunara' },
      { amount_text: '30 ml', name: 'Grand Marnier' },
      { amount_text: '40 ml', name: 'Lemon juice' },
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Lime wheel (optional)',
  },
  {
    slug: 'dragones-tiki',
    venue: 'Dante',
    ingredients: [
      { amount_text: '45 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '20 ml', name: 'Amaretto Disaronno' },
      { amount_text: '45 ml', name: 'Honey water' },
      { amount_text: '40 ml', name: 'Pineapple mix' },
    ],
    glass_type: 'Highball',
  },
  {
    slug: 'dragoni',
    venue: 'Limantour',
    ingredients: [
      { amount_text: '45 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '30 ml', name: 'Housemade vermouth' },
      { amount_text: '40 ml', name: 'Fino Sherry Tio Pepe' },
      { amount_text: '15 ml', name: 'Maraschino liqueur' },
      { amount_text: '5 ml', name: 'Yellow lemon juice' },
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Lemon slice',
  },
  {
    slug: 'essence-of-san-miguel',
    venue: 'Limantour',
    ingredients: [
      { amount_text: '30 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '25 ml', name: 'Italicus' },
      { amount_text: '25 ml', name: 'Ginger-infused limoncello' },
      { amount_text: '15 ml', name: 'Grapefruit juice' },
      { amount_text: '10 ml', name: 'Yellow lemon juice' },
    ],
    glass_type: 'Coupe',
    garnish: 'White flowers',
  },
  {
    slug: 'ginger-limoncello',
    venue: 'Limantour (sub-recipe)',
    ingredients: [
      { amount_text: '750 ml', name: 'Limoncello' },
      { amount_text: '350 g', name: 'Ginger' },
    ],
    method: [
      'Combine Limoncello and ginger in a sous-vide bag or sealed vessel.',
      'Cook at 55°C for two hours.',
      'Strain and bottle. Yields ~750 ml.',
    ],
    glass_type: 'Bottle',
  },
  {
    slug: 'dragones-punch',
    venue: 'Limantour',
    ingredients: [
      { amount_text: '100 ml', name: 'Dragones punch batch' },
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Mint sprig, cucumber slice',
  },
  {
    slug: 'kiwi',
    venue: 'Limantour',
    ingredients: [
      { amount_text: '45 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '30 ml', name: 'Sake Junmai' },
      { amount_text: '20 ml', name: 'Kiwi cordial' },
    ],
    glass_type: 'Nick & Nora',
    garnish: 'Fresh kiwi cube',
  },
  {
    slug: 'a-random-tequila-sour',
    venue: 'Limantour',
    ingredients: [
      { amount_text: '100 ml', name: 'Clarified Tequila Sour' },
    ],
    glass_type: 'Old Fashioned',
    garnish: '2 green grape slices, 2 red grape slices',
  },
  {
    slug: 'spring-clericot',
    venue: 'Limantour',
    ingredients: [
      { amount_text: '30 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '50 ml', name: 'Green melon juice' },
      { amount_text: '60 ml', name: 'Bouquet Garni wine' },
      { amount_text: '30 ml', name: 'Sparkling water' },
    ],
    glass_type: 'Wine',
    garnish: '3 green melon spheres, 1 cucumber slice',
  },
]

for (const fix of FIXES) {
  const { data: c } = await admin
    .from('cocktails')
    .select('id, name')
    .eq('workspace_id', ws.id)
    .eq('slug', fix.slug)
    .maybeSingle()
  if (!c) {
    console.warn(`! ${fix.slug} not found`)
    continue
  }

  // Rebuild ingredients
  await admin.from('cocktail_ingredients').delete().eq('cocktail_id', c.id)
  const ingRows = fix.ingredients.map((ing, idx) => ({
    cocktail_id: c.id,
    position: idx + 1,
    custom_name: ing.name,
    amount_text: ing.amount_text,
    global_product_id: ing.product ? pid(ing.product) : null,
  }))
  const { error: ingErr } = await admin.from('cocktail_ingredients').insert(ingRows)
  if (ingErr) {
    console.error(`! ${fix.slug} ingredients:`, ingErr.message)
    continue
  }

  // Update cocktail fields
  const update = {}
  if (fix.glass_type) update.glass_type = fix.glass_type
  if (fix.garnish !== undefined) update.garnish = fix.garnish
  if (fix.method) update.method_steps = fix.method.map((text, i) => ({ step: i + 1, text }))
  if (Object.keys(update).length > 0) {
    await admin.from('cocktails').update(update).eq('id', c.id)
  }

  console.log(`✓ ${c.name.padEnd(28)} · ${fix.venue}`)
}

console.log(`\n✓ ${FIXES.length} cocktails updated from docx`)
