// Hand-written fixes for San Miguel Mule + White Dragon.
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
    slug: 'san-miguel-mule',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Reposado Mizunara' },
      { amount_text: '¼ oz', name: 'Lemon juice' },
      { amount_text: '4 oz', name: 'Ginger beer' },
    ],
    method: [
      'Build the tequila, lemon juice, and ginger beer in a highball glass over ice.',
      'Stir gently to combine.',
      'Garnish with a fresh dill leaf.',
    ],
    glass_type: 'Highball',
    garnish: 'Dill leaf',
    flavor_profile: ['Citrus', 'Spicy', 'Herbal'],
    tasting_notes:
      "Fabiola Padilla's San Miguel spin on the Mule — Casa Dragones Reposado Mizunara's Japanese-oak finish meets ginger and lemon, with a dill leaf pulling everything gently herbal. Long, dry, and easy to drink in a Bekeb courtyard.",
  },
  {
    slug: 'white-dragon',
    ingredients: [
      { amount_text: '2 oz', name: 'Casa Dragones Blanco (infused with orange peel)' },
      { amount_text: '1 oz', name: 'St-Germain elderflower liqueur' },
      { amount_text: '¼ oz', name: 'Ginger juice' },
      { amount_text: '½ oz', name: 'Lime juice' },
      { amount_text: 'top', name: 'Tonic water' },
    ],
    method: [
      'Combine the orange-peel-infused tequila, St-Germain, ginger juice, and lime juice in a shaker with ice.',
      'Shake until well chilled.',
      'Strain into a highball glass filled with fresh ice.',
      'Top with tonic water.',
      'Garnish with an orange peel.',
    ],
    glass_type: 'Highball',
    garnish: 'Orange peel',
    flavor_profile: ['Floral', 'Citrus', 'Spicy', 'Sparkling'],
    tasting_notes:
      'Orange-peel-infused Casa Dragones Blanco meets elderflower and ginger in a refreshing highball — St-Germain adds floral lift, lime and tonic keep it crisp. A spring-forward cooler that drinks like perfume in a glass.',
  },
]

for (const fix of FIXES) {
  const { data: c } = await admin
    .from('cocktails')
    .select('id, name')
    .eq('workspace_id', ws.id)
    .eq('slug', fix.slug)
    .maybeSingle()
  if (!c) continue
  await admin.from('cocktail_ingredients').delete().eq('cocktail_id', c.id)
  const ingRows = fix.ingredients.map((ing, idx) => ({
    cocktail_id: c.id,
    position: idx + 1,
    custom_name: ing.name,
    amount_text: ing.amount_text,
  }))
  await admin.from('cocktail_ingredients').insert(ingRows)
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
