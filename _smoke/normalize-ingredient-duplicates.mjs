// Consolidate duplicate ingredient names, fix misspellings, and split
// obvious parsing errors. Idempotent.
//
// Run: node --env-file=.env.local _smoke/normalize-ingredient-duplicates.mjs [--dry]

import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry')
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── canonicalization rules ──────────────────────────────────────────

// Regex-based rewrites applied in order. Operate on the full display name.
const REGEX_FIXES = [
  // Trailing stray dash / punctuation artifact (e.g. "Tomato Water -")
  { from: /\s*[-–—]\s*$/g, to: '' },
  // "Liquor" → "Liqueur" (correct English spelling)
  { from: /\bLiquor\b/g, to: 'Liqueur' },
  // Pedro Ximénez misspellings (accents canonical)
  { from: /\b(Pedro\s+Xim[aeéí]?nez)\b/gi, to: 'Pedro Ximénez' },
  // Cempasúchil variants
  { from: /\bCempasuchitl\b/gi, to: 'Cempasúchil' },
  { from: /\bCempasuchil\b/gi, to: 'Cempasúchil' },
  // Giffards → Giffard
  { from: /\bGiffards\b/g, to: 'Giffard' },
  // Turmeric misspelling
  { from: /\bTumeric\b/gi, to: 'Turmeric' },
  // Strip "Rothmant" (likely "Rothman" OCR error)
  { from: /\bRothmant\b/g, to: 'Rothman' },
]

// Whole-name canonical map. Match is case-insensitive against the full
// cleaned name.
const CANONICAL = new Map([
  // --- Lime juice family → "Fresh Lime Juice" --------------------------
  ['lime juice', 'Fresh Lime Juice'],
  ['fresh lime juice', 'Fresh Lime Juice'],
  ['fresh-squeezed lime juice', 'Fresh Lime Juice'],
  ['freshly squeezed lime juice', 'Fresh Lime Juice'],
  ['fresh squeezed lime juice', 'Fresh Lime Juice'],
  ['mexican lime juice', 'Fresh Lime Juice'],
  ['key lime juice', 'Fresh Lime Juice'],
  ['jugo de limón verde', 'Fresh Lime Juice'],
  ['jugo de limon verde', 'Fresh Lime Juice'],
  ['sp lime', 'Fresh Lime Juice'],
  ['lime', 'Fresh Lime Juice'],

  // --- Lemon juice family ----------------------------------------------
  ['lemon juice', 'Fresh Lemon Juice'],
  ['fresh lemon juice', 'Fresh Lemon Juice'],
  ['fresh-squeezed lemon juice', 'Fresh Lemon Juice'],
  ['freshly squeezed lemon juice', 'Fresh Lemon Juice'],
  ['fresh squeezed lemon juice', 'Fresh Lemon Juice'],
  ['yellow lemon juice', 'Fresh Lemon Juice'],
  ['jugo de limón amarillo', 'Fresh Lemon Juice'],
  ['jugo de limon amarillo', 'Fresh Lemon Juice'],

  // --- Grapefruit juice -------------------------------------------------
  ['grapefruit juice', 'Fresh Grapefruit Juice'],
  ['fresh grapefruit juice', 'Fresh Grapefruit Juice'],
  ['pink grapefruit juice', 'Fresh Grapefruit Juice'],

  // --- Orange juice ----------------------------------------------------
  ['orange juice', 'Fresh Orange Juice'],
  ['fresh orange juice', 'Fresh Orange Juice'],
  ['fresh-squeezed orange juice', 'Fresh Orange Juice'],

  // --- Agave family → "Agave Syrup" ------------------------------------
  ['agave', 'Agave Syrup'],
  ['agave syrup', 'Agave Syrup'],
  ['agave nectar', 'Agave Syrup'],
  ['agave honey', 'Agave Syrup'],
  ['organic agave', 'Agave Syrup'],
  ['organic agave syrup', 'Agave Syrup'],
  ['organic agave nectar', 'Agave Syrup'],
  ['miel de agave', 'Agave Syrup'],

  // --- Simple syrup family ---------------------------------------------
  ['simple syrup', 'Simple Syrup'],
  ['natural syrup', 'Simple Syrup'],
  ['simple syrup to taste', 'Simple Syrup'],
  ['syrup', 'Simple Syrup'],
  ['sugar syrup', 'Simple Syrup'],

  // --- St-Germain -------------------------------------------------------
  ['st-germain', 'St-Germain'],
  ['st germain', 'St-Germain'],
  ['st. germain', 'St-Germain'],
  ['st germain liqueur', 'St-Germain'],
  ['st-germain liqueur', 'St-Germain'],
  ['st. germain liqueur', 'St-Germain'],
  ['st germain elderflower liqueur', 'St-Germain'],

  // --- Pedro Ximénez (sherry) ------------------------------------------
  ['pedro ximénez', 'Pedro Ximénez Sherry'],
  ['pedro ximenez', 'Pedro Ximénez Sherry'],
  ['pedro ximanez', 'Pedro Ximénez Sherry'],
  ['pedro ximénez sherry', 'Pedro Ximénez Sherry'],
  ['pedro ximenez sherry', 'Pedro Ximénez Sherry'],
  ['px sherry', 'Pedro Ximénez Sherry'],

  // --- Triple Sec -------------------------------------------------------
  ['triple sec', 'Triple Sec'],
  ['orange triple sec', 'Triple Sec'],

  // --- Dolin Blanc / Dry ------------------------------------------------
  ['dolin blanc', 'Dolin Blanc Vermouth'],
  ['dolin blanc vermouth', 'Dolin Blanc Vermouth'],
  ['dolin dry', 'Dolin Dry Vermouth'],
  ['dolin dry vermouth', 'Dolin Dry Vermouth'],

  // --- Egg white --------------------------------------------------------
  ['egg white', 'Egg White'],
  ['1 egg white', 'Egg White'],
  ['fresh egg white', 'Egg White'],

  // --- Angostura --------------------------------------------------------
  ['angostura', 'Angostura Bitters'],
  ['angostura bitters', 'Angostura Bitters'],
  ['dash angostura', 'Angostura Bitters'],

  // --- Velvet Falernum --------------------------------------------------
  ['velvet falernum', 'Velvet Falernum'],
  ['velvet falernum liqueur', 'Velvet Falernum'],
  ["taylor's velvet falernum", 'Velvet Falernum'],

  // --- Ginger family ----------------------------------------------------
  ['ginger', 'Fresh Ginger'],
  ['fresh ginger', 'Fresh Ginger'],
  ['fresh pressed ginger', 'Fresh Ginger'],
  ['fresh-pressed ginger', 'Fresh Ginger'],
  ['quarter piece ginger', 'Fresh Ginger'],
  ['ginger slices', 'Fresh Ginger'],
  ['ginger slice', 'Fresh Ginger'],

  // --- Hibiscus tea family ---------------------------------------------
  ['hibiscus', 'Hibiscus Tea'],
  ['hibiscus tea', 'Hibiscus Tea'],
  ['hot hibiscus tea', 'Hibiscus Tea'],
  ['hibiscus flower tea', 'Hibiscus Tea'],

  // --- Mint family ------------------------------------------------------
  ['mint', 'Fresh Mint'],
  ['mint leaves', 'Fresh Mint'],
  ['fresh mint leaves', 'Fresh Mint'],
  ['mint sprig', 'Fresh Mint'],
  ['mint sprigs', 'Fresh Mint'],
  ['hierbabuena leaves', 'Fresh Mint'],
  ['hierbabuena', 'Fresh Mint'],
  ['yerbabuena', 'Fresh Mint'],

  // --- Jalapeño family --------------------------------------------------
  ['jalapeño', 'Fresh Jalapeño'],
  ['jalapeno', 'Fresh Jalapeño'],
  ['jalapeños', 'Fresh Jalapeño'],
  ['jalapenos', 'Fresh Jalapeño'],
  ['fresh jalapeño', 'Fresh Jalapeño'],
  ['fresh jalapeno', 'Fresh Jalapeño'],
  ['quarter seeded jalapeño chile', 'Fresh Jalapeño'],
  ['quarter seeded jalapeno chile', 'Fresh Jalapeño'],

  // --- Soda Water family (keep branded Q Soda separate) ----------------
  ['soda', 'Soda Water'],
  ['soda water', 'Soda Water'],
  ['club soda', 'Soda Water'],
  ['sparkling water', 'Soda Water'],

  // --- Lemongrass Syrup -------------------------------------------------
  ['lemongrass syrup', 'Lemongrass Syrup'],
  ['homemade lemongrass syrup', 'Lemongrass Syrup'],

  // --- Honey family -----------------------------------------------------
  // Raw honey (no dilution/syrup)
  ['honey', 'Honey'],
  ['liquid honey', 'Honey'],
  ['virgin honey', 'Honey'],
  ['garden honey', 'Honey'],
  ['touch of honey', 'Honey'],
  // Honey syrup (diluted 2:1 or 1:1)
  ['honey syrup', 'Honey Syrup'],
  ['honey syrup 2:1', 'Honey Syrup'],
  ['honey syrup (2:1)', 'Honey Syrup'],
])

// Explicit fixes for rows that were clearly two ingredients merged into
// one — keep only the first, primary ingredient.
const PARSING_ERROR_FIXES = new Map([
  ['Green Prickly Pear Puree 1⁄2 Oz Lemon Juice', 'Green Prickly Pear Puree'],
  ['Green Prickly Pear Puree 1/2 Oz Lemon Juice', 'Green Prickly Pear Puree'],
  ['Mint Leaves, and Pomegranate Seeds', 'Mint Leaves'],
  ['Lime Wheels and Peppermint Leaves', 'Lime Wheels'],
  ['Orange Liqueur and Homemade Mix', 'Orange Liqueur'],
])

// ─── fetch all custom-name rows ──────────────────────────────────────
let all = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await admin
    .from('cocktail_ingredients')
    .select('id, custom_name, global_ingredient_id, workspace_ingredient_id, global_product_id')
    .range(from, from + 999)
  if (error) { console.error('!', error.message); process.exit(1) }
  if (!data || data.length === 0) break
  all = all.concat(data)
  if (data.length < 1000) break
}
console.log(`→ scanning ${all.length} rows`)

// ─── compute patches ─────────────────────────────────────────────────
const updates = []
for (const row of all) {
  if (row.global_ingredient_id || row.workspace_ingredient_id || row.global_product_id) continue
  if (!row.custom_name) continue

  let name = row.custom_name

  // 1. Parsing errors first (exact match)
  if (PARSING_ERROR_FIXES.has(name)) {
    name = PARSING_ERROR_FIXES.get(name)
  }

  // 2. Regex rewrites (spelling / accent / typo fixes)
  for (const { from: re, to } of REGEX_FIXES) {
    name = name.replace(re, to)
  }

  // 3. Whole-name canonical mapping (case-insensitive key lookup)
  const canonical = CANONICAL.get(name.trim().toLowerCase())
  if (canonical) name = canonical

  if (name !== row.custom_name) {
    updates.push({ id: row.id, before: row.custom_name, after: name })
  }
}

console.log(`→ ${updates.length} rows to rewrite`)

if (DRY) {
  const bySet = new Map()
  for (const u of updates) {
    const k = `${u.before} → ${u.after}`
    bySet.set(k, (bySet.get(k) ?? 0) + 1)
  }
  const entries = [...bySet.entries()].sort((a, b) => b[1] - a[1])
  for (const [k, n] of entries.slice(0, 60)) console.log(`  [${n}] ${k}`)
  if (entries.length > 60) console.log(`  (… ${entries.length - 60} more distinct)`)
  process.exit(0)
}

// ─── apply ───────────────────────────────────────────────────────────
let ok = 0
let fail = 0
for (const u of updates) {
  const { error } = await admin
    .from('cocktail_ingredients')
    .update({ custom_name: u.after })
    .eq('id', u.id)
  if (error) { fail++; console.error('!', u.id, error.message) }
  else ok++
  if ((ok + fail) % 100 === 0) console.log(`  … ${ok + fail}/${updates.length}`)
}

console.log(`\n✓ ${ok} updated · ${fail} failed`)
