// Fix 2 cocktails whose ingredients got dumped into method_steps instead of
// being parsed into ingredient rows.
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
    slug: 'don-patron-margarita',
    ingredients: [
      { amount_text: '2 oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '½ oz', name: 'Grand Marnier' },
      { amount_text: '¼ oz', name: 'Louis Alexander liqueur' },
      { amount_text: '¾ oz', name: 'Fresh lime juice' },
      { amount_text: '2 slices', name: 'Fresh ginger' },
    ],
    method: [
      'Muddle the fresh ginger slices in a shaker.',
      'Add the Casa Dragones Blanco, Grand Marnier, Louis Alexander liqueur, and lime juice.',
      'Shake with ice.',
      'Double strain into an old-fashioned glass over fresh ice.',
      'Garnish with a mandarine twist.',
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Ginger and mandarine twist',
    flavor_profile: ['Citrus', 'Spicy', 'Sweet'],
    tasting_notes:
      'A ginger-mandarin Margarita riff — two slices of fresh ginger muddled with Grand Marnier and Louis Alexander liqueur, lime for tightness. Casa Dragones Blanco carries the agave spine. Double-strained over fresh ice, finished with a mandarine twist.',
  },
  {
    slug: 'mandarin-dragon-margarita',
    ingredients: [
      { amount_text: '2 oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '½ oz', name: 'Grand Marnier' },
      { amount_text: '1 oz', name: 'Fresh mandarine juice' },
      { amount_text: '½ oz', name: 'Fresh lime juice' },
      { amount_text: '½ oz', name: 'Simple syrup' },
    ],
    method: [
      'Rim an old-fashioned glass with a sugar-and-Tajín mix.',
      'Combine all ingredients in a shaker with ice.',
      'Shake until well chilled.',
      'Strain into the rimmed glass over fresh ice.',
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Sugar and Tajín rim',
    flavor_profile: ['Citrus', 'Fruity', 'Sweet'],
    tasting_notes:
      'A mandarin-forward Margarita — fresh mandarine juice replaces most of the lime, Grand Marnier adds cognac-orange depth, simple rounds the balance. Casa Dragones Blanco up front. Sugar and Tajín on the rim finish the sweet-heat arc.',
  },
]

for (const fix of FIXES) {
  const { data: c } = await admin
    .from('cocktails')
    .select('id, name')
    .eq('workspace_id', ws.id)
    .eq('slug', fix.slug)
    .maybeSingle()
  if (!c) { console.warn(`! ${fix.slug} not found`); continue }

  await admin.from('cocktail_ingredients').delete().eq('cocktail_id', c.id)
  const ingRows = fix.ingredients.map((ing, idx) => ({
    cocktail_id: c.id,
    position: idx + 1,
    custom_name: ing.name,
    amount_text: ing.amount_text,
    global_product_id: ing.product ? pid(ing.product) : null,
  }))
  await admin.from('cocktail_ingredients').insert(ingRows)

  await admin
    .from('cocktails')
    .update({
      method_steps: fix.method.map((text, i) => ({ step: i + 1, text })),
      glass_type: fix.glass_type,
      garnish: fix.garnish,
      flavor_profile: fix.flavor_profile,
      tasting_notes: fix.tasting_notes,
    })
    .eq('id', c.id)
  console.log(`✓ ${c.name}`)
}
