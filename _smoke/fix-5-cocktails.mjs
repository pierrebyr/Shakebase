// Hand-written fixes for 5 cocktails where method instructions leaked into
// the ingredient list during xlsx3 import. Each gets a clean ingredient list,
// proper method steps, garnish/glass/flavor, and an enriched tasting note.

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: ws } = await admin
  .from('workspaces')
  .select('id')
  .eq('slug', 'casa-dragones')
  .maybeSingle()

const FIXES = [
  {
    slug: 'las-tres-damas',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Blanco' },
      { amount_text: '¾ oz', name: 'Grapefruit juice' },
      { amount_text: '½ oz', name: 'Fino sherry' },
      { amount_text: '½ oz', name: 'Rosemary syrup' },
      { amount_text: '1', name: 'Egg white' },
      { amount_text: 'top', name: 'Soda water' },
    ],
    method: [
      'Dry shake the tequila, grapefruit juice, Fino sherry, rosemary syrup, and egg white with a few coffee beans and a fresh rosemary sprig.',
      'Shake again with ice and fine strain into a chilled Collins glass filled with ice.',
      'Top with soda water.',
      'Garnish with edible flowers and a pinch of volcanic salt.',
    ],
    glass_type: 'Collins',
    garnish: 'Edible flowers and volcanic salt',
    flavor_profile: ['Citrus', 'Herbal', 'Sherry', 'Creamy'],
    tasting_notes:
      'A fizzy, savory-aromatic sour where Fino sherry and rosemary lift Casa Dragones Blanco into floral territory — coffee-bean dry-shake perfumes the foam, soda water opens the finish, and a dusting of volcanic salt grounds the whole thing.',
  },
  {
    slug: 'oasis-del-desierto',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Blanco' },
      { amount_text: '¾ oz', name: 'Xoconostle' },
      { amount_text: '½ oz', name: 'Ancho Reyes' },
      { amount_text: 'top', name: 'Prosecco' },
    ],
    method: [
      'Build the tequila, Xoconostle, and Ancho Reyes in an old-fashioned glass over ice.',
      'Stir briefly to combine.',
      'Top with chilled Prosecco.',
    ],
    glass_type: 'Old Fashioned',
    garnish: null,
    flavor_profile: ['Spicy', 'Fruity', 'Sparkling'],
    tasting_notes:
      'Desert-tart Xoconostle cactus-pear meets the smoky heat of Ancho Reyes, all opened up with dry Prosecco — a bright, spice-forward aperitif that makes Casa Dragones Blanco taste like a cold wind off the high desert.',
  },
  {
    slug: 'paloma-305',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Blanco' },
      { amount_text: '1 oz', name: 'Grapefruit juice (muddled with strawberry and watermelon)' },
      { amount_text: '1 oz', name: 'Vermouth Rosso' },
      { amount_text: '⅓ oz', name: 'Lime juice' },
      { amount_text: '¼ oz', name: 'Agave syrup' },
      { amount_text: 'top', name: 'Grapefruit soda' },
    ],
    method: [
      'In a shaker, muddle the strawberry and watermelon with the grapefruit juice.',
      'Add the tequila, Vermouth Rosso, lime juice, and agave syrup, plus a cinnamon stick and ribbons of orange and grapefruit peel.',
      'Shake with ice.',
      'Fine strain into a highball glass over fresh ice.',
      'Top with grapefruit soda.',
      'Garnish with a watermelon slice dusted with ground cinnamon.',
    ],
    glass_type: 'Highball',
    garnish: 'Watermelon slice with cinnamon',
    flavor_profile: ['Citrus', 'Fruity', 'Herbal', 'Sparkling'],
    tasting_notes:
      'A tropical, spiced riff on the Paloma — strawberry, watermelon, and cinnamon ride a dry vermouth backbone, with grapefruit soda giving the drink its signature pink-edged fizz. Muddled fruit and citrus oil carry Casa Dragones Blanco into sunset-patio territory.',
  },
  {
    slug: 'mestizo',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Blanco' },
      { amount_text: '⅔ oz', name: 'Metaxa infused with figs' },
      { amount_text: '⅓ oz', name: 'Grand Marnier' },
      { amount_text: '1 dash', name: 'Black lemon' },
      { amount_text: 'top', name: 'Soda water' },
    ],
    method: [
      'Build the tequila, fig-infused Metaxa, Grand Marnier, and a dash of black-lemon bitters in a chilled highball over ice.',
      'Top with soda water and stir gently.',
    ],
    glass_type: 'Highball',
    garnish: null,
    flavor_profile: ['Fruity', 'Citrus', 'Sparkling'],
    tasting_notes:
      'Dried-fig Metaxa and Grand Marnier wrap Casa Dragones Blanco in a layer of warm orange and stone fruit, lifted with a whisper of black lemon and stretched long with soda — a low-alc highball that drinks like a Mediterranean afternoon in Mexico.',
  },
  {
    slug: 'paloma-menseja',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Blanco' },
      { amount_text: '½ oz', name: 'Lillet Blanc' },
      { amount_text: '1 oz', name: 'Xoconostle juice' },
      { amount_text: '¼ oz', name: 'Lime juice' },
      { amount_text: '1 dash', name: 'Fire tincture' },
      { amount_text: 'top', name: 'Grapefruit soda' },
    ],
    method: [
      'Build all ingredients except the grapefruit soda in a highball glass.',
      'Add ice and stir gently to combine.',
      'Top with grapefruit soda.',
      'Garnish with a grapefruit twist.',
    ],
    glass_type: 'Highball',
    garnish: 'Grapefruit twist',
    flavor_profile: ['Fruity', 'Citrus', 'Spicy', 'Sparkling'],
    tasting_notes:
      'Xoconostle cactus-pear and Lillet Blanc trade tart against floral, a fire-tincture dash draws the jalapeño out of the agave, and grapefruit soda lengthens the whole thing into a Paloma with desert edges.',
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
  }))
  await admin.from('cocktail_ingredients').insert(ingRows)

  // Update cocktail
  const methodSteps = fix.method.map((text, i) => ({ step: i + 1, text }))
  await admin
    .from('cocktails')
    .update({
      method_steps: methodSteps,
      glass_type: fix.glass_type,
      garnish: fix.garnish,
      flavor_profile: fix.flavor_profile,
      tasting_notes: fix.tasting_notes,
    })
    .eq('id', c.id)

  console.log(`✓ ${c.name.padEnd(26)} · ${fix.ingredients.length} ing · ${fix.method.length} steps`)
}
