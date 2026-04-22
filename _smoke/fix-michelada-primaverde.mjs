// Rewrite Michelada Primaverde from the clean xlsx3 source.
// Run: node --env-file=.env.local _smoke/fix-michelada-primaverde.mjs

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

const { data: cocktail } = await admin
  .from('cocktails')
  .select('id, name')
  .eq('workspace_id', ws.id)
  .eq('slug', 'michelada-primaverde')
  .maybeSingle()

if (!cocktail) {
  console.error('Michelada Primaverde not found')
  process.exit(1)
}

// Clean ingredients from xlsx3
const ingredients = [
  { amount_text: '60 ml', name: 'Tequila Casa Dragones Blanco' },
  { amount_text: '22 ml', name: 'Dolin Dry Vermouth' },
  { amount_text: '22 ml', name: 'Lemon juice' },
  { amount_text: '22 ml', name: 'Tomatillo juice' },
  { amount_text: '15 ml', name: 'Agave honey' },
  { amount_text: '¼', name: 'Seeded jalapeño chile' },
  { amount_text: '4 oz', name: 'Victoria beer (to top)' },
]

// Clean method — rewritten for clarity
const methodSteps = [
  { step: 1, text: 'In a shaker, muddle the agave honey with the seeded jalapeño slice.' },
  { step: 2, text: 'Add the tequila, vermouth, lemon juice, and tomatillo juice. Shake with ice.' },
  { step: 3, text: 'Strain 2 oz of the mixture (reserve the rest) into a Pilsner glass rimmed with worm salt or kosher salt and filled with ice.' },
  { step: 4, text: 'Top with 4 oz of Victoria beer and stir gently.' },
  { step: 5, text: 'Garnish with a slice of jalapeño.' },
]

// Delete existing ingredients
await admin.from('cocktail_ingredients').delete().eq('cocktail_id', cocktail.id)

// Insert clean ones
const ingRows = ingredients.map((ing, idx) => ({
  cocktail_id: cocktail.id,
  position: idx + 1,
  custom_name: ing.name,
  amount_text: ing.amount_text,
}))
await admin.from('cocktail_ingredients').insert(ingRows)

// Update method + other fields
await admin.from('cocktails').update({
  method_steps: methodSteps,
  glass_type: 'Pilsner',
  garnish: 'Jalapeño slice',
  flavor_profile: ['Spicy', 'Citrus', 'Umami'],
  tasting_notes: "Jim Meehan's savory take on the Michelada — tequila meets tomatillo and jalapeño, brightened by lemon and softened with Victoria lager over salted ice.",
  category: 'Beer Cocktail',
}).eq('id', cocktail.id)

console.log('✓ Michelada Primaverde rewritten from clean source')
