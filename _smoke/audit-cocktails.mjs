// Audit every Casa Dragones cocktail for data quality issues:
//   1. Missing fields (glass_type, garnish, flavor_profile, method_steps, tasting_notes)
//   2. Spanish words in free-text (tasting_notes, method_steps, custom_name)
//   3. Ingredient lines that still contain concatenated quantities (parsing leak)
//   4. Compound creator names (contain " & " or ",")
//   5. Empty ingredient + empty method (stub entries)

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

const { data: cocktails } = await admin
  .from('cocktails')
  .select(
    'id, slug, name, category, glass_type, garnish, tasting_notes, flavor_profile, method_steps, creator_id, creators(name)',
  )
  .eq('workspace_id', ws.id)
  .order('name')

const { data: ingredients } = await admin
  .from('cocktail_ingredients')
  .select('cocktail_id, custom_name, amount_text, position')
  .in('cocktail_id', cocktails.map((c) => c.id))

const ingByCocktail = new Map()
for (const i of ingredients ?? []) {
  if (!ingByCocktail.has(i.cocktail_id)) ingByCocktail.set(i.cocktail_id, [])
  ingByCocktail.get(i.cocktail_id).push(i)
}

// Spanish words that clearly indicate untranslated text (heuristic — not exhaustive)
const spanishMarkers = [
  'ingredientes', 'jugo', 'toronja', 'limón', 'limon', 'recién',
  'botellas', 'litros', 'cucharadita', 'cucharada', 'con hielo',
  'mezclar', 'colar', 'agitar', 'servir', 'añadir',
  ' para ', ' con ', ' de ', ' y ', ' el ', ' la ', ' los ', ' las ',
  'después', 'antes', 'cóctel', 'coctel', 'preparación',
  'agua mineral', 'jugo de', 'rodaja', 'hoja ', 'hojas',
  'natural', 'fresca', 'fresco', 'copa', 'vaso',
]

function isSpanish(text) {
  if (!text) return false
  const t = text.toLowerCase()
  let hits = 0
  for (const m of spanishMarkers) {
    if (t.includes(m)) hits++
    if (hits >= 2) return true
  }
  return false
}

// Ingredient line looks like parse-leaked if it contains ≥2 quantity tokens
const qtyTokenRe = /\b(oz|tsp|tbsp|ml|dash|dashes|drops?|barspoon|slice|sprig|cups?)\b/gi
function leakedIngredient(line) {
  if (!line) return false
  const matches = line.match(qtyTokenRe)
  return (matches?.length ?? 0) >= 2
}

const report = {
  total: cocktails.length,
  missingGlass: [],
  missingGarnish: [],
  missingNotes: [],
  missingFlavor: [],
  emptyMethod: [],
  emptyIngredients: [],
  totalStubs: [],         // both empty ingredients AND empty method
  spanishNotes: [],
  spanishMethod: [],
  compoundCreator: [],
  leakedIngredients: [],  // list of {slug, line}
}

for (const c of cocktails) {
  if (!c.glass_type) report.missingGlass.push(c.slug)
  if (!c.garnish) report.missingGarnish.push(c.slug)
  if (!c.tasting_notes || c.tasting_notes.length < 20) report.missingNotes.push(c.slug)
  if (!c.flavor_profile || c.flavor_profile.length === 0) report.missingFlavor.push(c.slug)

  const methodArr = Array.isArray(c.method_steps) ? c.method_steps : []
  if (methodArr.length === 0) report.emptyMethod.push(c.slug)

  const ings = ingByCocktail.get(c.id) ?? []
  if (ings.length === 0) report.emptyIngredients.push(c.slug)

  if (ings.length === 0 && methodArr.length === 0) report.totalStubs.push(c.slug)

  if (isSpanish(c.tasting_notes)) report.spanishNotes.push(c.slug)

  const methodFlat = methodArr.map((s) => s.text ?? '').join(' ')
  if (isSpanish(methodFlat)) report.spanishMethod.push(c.slug)

  const creatorName = c.creators?.name ?? ''
  if (creatorName && (creatorName.includes(' & ') || creatorName.includes(','))) {
    report.compoundCreator.push({ slug: c.slug, creator: creatorName })
  }

  for (const i of ings) {
    if (leakedIngredient(i.custom_name)) {
      report.leakedIngredients.push({ slug: c.slug, line: i.custom_name })
    }
  }
}

console.log(`\nCASA DRAGONES COCKTAIL AUDIT — ${report.total} total\n`)
console.log(`Missing glass_type:      ${report.missingGlass.length} / ${report.total}`)
console.log(`Missing garnish:         ${report.missingGarnish.length} / ${report.total}`)
console.log(`Missing/short notes:     ${report.missingNotes.length} / ${report.total}`)
console.log(`Missing flavor_profile:  ${report.missingFlavor.length} / ${report.total}`)
console.log(`Empty method_steps:      ${report.emptyMethod.length} / ${report.total}`)
console.log(`Empty ingredients:       ${report.emptyIngredients.length} / ${report.total}`)
console.log(`Total stubs (both empty): ${report.totalStubs.length} / ${report.total}`)
console.log(`Spanish in tasting_notes: ${report.spanishNotes.length}`)
console.log(`Spanish in method_steps:  ${report.spanishMethod.length}`)
console.log(`Compound creator names:   ${report.compoundCreator.length}`)
console.log(`Leaked ingredient lines:  ${report.leakedIngredients.length}`)

console.log(`\n--- Total stubs (sample 10) ---`)
for (const s of report.totalStubs.slice(0, 10)) console.log(`  · ${s}`)

console.log(`\n--- Spanish tasting notes (sample 10) ---`)
for (const s of report.spanishNotes.slice(0, 10)) console.log(`  · ${s}`)

console.log(`\n--- Spanish method (sample 10) ---`)
for (const s of report.spanishMethod.slice(0, 10)) console.log(`  · ${s}`)

console.log(`\n--- Compound creators ---`)
for (const s of report.compoundCreator.slice(0, 20)) console.log(`  · ${s.slug} → "${s.creator}"`)

console.log(`\n--- Leaked ingredient samples ---`)
for (const s of report.leakedIngredients.slice(0, 10)) console.log(`  · ${s.slug}: "${s.line}"`)

// Dump the whole report to a file for drill-down
import { writeFile } from 'node:fs/promises'
await writeFile('/tmp/cocktail-audit.json', JSON.stringify(report, null, 2))
console.log('\n→ full report written to /tmp/cocktail-audit.json')
