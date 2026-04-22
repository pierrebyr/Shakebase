// Explicit fixes for weird cocktail_ingredients.custom_name values found
// by scan-ingredient-anomalies.mjs.
//
// - Move parentheticals / "X, for Garnish" / recipe descriptions to notes
// - Strip junk prefixes like "X Oz. Cointreau" → "Cointreau"
// - Delete commentary rows that aren't real ingredients
//
// Idempotent. Run: node --env-file=.env.local _smoke/fix-weird-ingredients.mjs

import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry')

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// Map: exact current custom_name → action
//   { name, notes? }  → rename + optionally merge notes
//   'delete'          → drop the row entirely
const FIXES = {
  'Verdita: Pineapple Juice, Cilantro, Mint, Serrano Chiles': {
    name: 'Verdita',
    notes: 'blend of pineapple juice, cilantro, mint, serrano chiles',
  },
  'Jalapeños or Poblano Peppers': {
    name: 'Jalapeños',
    notes: 'or poblano peppers',
  },
  'Wtrmln Wtr or Fresh Watermelon Juice': { name: 'Watermelon Juice' },
  'X Oz. Cointreau': { name: 'Cointreau' },
  'Using Cd Blanco 1.75l to Reduce Glass Waste and Increase Sustainability': {
    name: 'Casa Dragones Blanco',
    notes: '1.75L format — reduces glass waste',
  },
  'A. Para Preparar El Puré, Necesitamos:': 'delete',
  'Milk, Ginger, Hoja Santa, Black Pepper, Orange Zest, Apple-Mint Smoke': {
    name: 'Smoked Milk Infusion',
    notes: 'milk · ginger · hoja santa · black pepper · orange zest · apple-mint smoke',
  },
  'Angostura Bitters (added in Glass)': {
    name: 'Angostura Bitters',
    notes: 'added in glass',
  },
  'Frozen Dragon Fruit (dragon Eggs!)': {
    name: 'Frozen Dragon Fruit',
    notes: 'a.k.a. "dragon eggs"',
  },
  'Grapefruit Juice (muddled with Strawberry and Watermelon)': {
    name: 'Grapefruit Juice',
    notes: 'muddled with strawberry and watermelon',
  },
  'Guava-Cacao-Basil-Agave-Honey Syrup (with Cinnamon)': {
    name: 'Guava-Cacao-Basil-Agave-Honey Syrup',
    notes: 'with cinnamon',
  },
  'Limoncello Villa Massa (rested with Basil)': {
    name: 'Limoncello Villa Massa',
    notes: 'rested with basil',
  },
  'Mango Foam (for Float)': {
    name: 'Mango Foam',
    notes: 'to float on top',
  },
  'Martini 16 (vermouth)': { name: 'Martini 16 Vermouth' },
  'Mistela Pijoan (sweet Pink Vermouth)': {
    name: 'Mistela Pijoan',
    notes: 'sweet pink vermouth',
  },
  'Seeded Jalapeño (cut Into Slices)': {
    name: 'Seeded Jalapeño',
    notes: 'cut into slices',
  },
  'Syrup (onion-Cumin)': { name: 'Onion-Cumin Syrup' },
  'Zanamora (balsamic-Sugar Reduction)': {
    name: 'Zanamora',
    notes: 'balsamic-sugar reduction',
  },
  'Coconut Flakes, for Garnish': {
    name: 'Coconut Flakes',
    notes: 'for garnish',
  },
  'Ground Cacao, for Garnish': {
    name: 'Ground Cacao',
    notes: 'for garnish',
  },
  'Mango-Habanero Syrup (400 G Mango, 800 G Sugar, ¼ Habanero Batch)': {
    name: 'Mango-Habanero Syrup',
    notes: '400 g mango · 800 g sugar · ¼ habanero batch',
  },
}

// ─── fetch matching rows ─────────────────────────────────────────────
const names = Object.keys(FIXES)
const { data: rows, error } = await admin
  .from('cocktail_ingredients')
  .select('id, custom_name, notes')
  .in('custom_name', names)

if (error) {
  console.error('! fetch failed:', error.message)
  process.exit(1)
}
console.log(`→ matched ${rows?.length ?? 0} rows`)

let upd = 0
let del = 0
let skip = 0
for (const row of rows ?? []) {
  const fix = FIXES[row.custom_name]
  if (!fix) {
    skip++
    continue
  }

  if (fix === 'delete') {
    if (DRY) {
      console.log(`  DEL ${row.id} "${row.custom_name}"`)
    } else {
      const { error } = await admin.from('cocktail_ingredients').delete().eq('id', row.id)
      if (error) console.error('!', row.id, error.message)
      else del++
    }
    continue
  }

  const patch = { custom_name: fix.name }
  if (fix.notes && (!row.notes || !row.notes.trim())) {
    patch.notes = fix.notes
  } else if (fix.notes && row.notes && !row.notes.toLowerCase().includes(fix.notes.toLowerCase())) {
    patch.notes = `${row.notes.trim()}; ${fix.notes}`
  }

  if (DRY) {
    console.log(`  UPD ${row.id} "${row.custom_name}" → "${patch.custom_name}"${patch.notes ? `  [notes: ${patch.notes}]` : ''}`)
    continue
  }

  const { error } = await admin
    .from('cocktail_ingredients')
    .update(patch)
    .eq('id', row.id)
  if (error) console.error('!', row.id, error.message)
  else upd++
}

console.log(`\n✓ ${upd} updated · ${del} deleted · ${skip} skipped`)
