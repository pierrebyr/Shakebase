// Clean cocktail_ingredients.custom_name:
//   - strip leading quantity + unit prefixes that were bundled into the name
//     (e.g. "0.25 of Ginger" → "Ginger", "2 dashes Angostura" → "Angostura")
//   - strip stray leading "of"
//   - normalize whitespace + smart-case
//   - when the existing amount/unit columns are empty, backfill them from
//     the parsed prefix so the cocktail card still shows the right quantity
//
// Idempotent. Run: node --env-file=.env.local _smoke/clean-ingredient-names.mjs

import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry')

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const UNIT_RE =
  /^(grams?|gr|oz|ml|cl|l|dash(?:es)?|drops?|splash(?:es)?|bar\s?spoons?|barspoon|tsps?|tbsps?|teaspoons?|tablespoons?|pinch(?:es)?|pieces?|pc|pcs|slices?|sprigs?|leaf|leaves|wedges?|cubes?|twists?|top|float|part(?:s)?|cup|cups|shot|shots)\b\s*/i

const FRACTIONS = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

function parseLeadingNumber(s) {
  // Handles: "1.5", "1/2", "½", "1 ½", "3/4"
  const uni = Object.keys(FRACTIONS).join('')
  const re = new RegExp(
    `^(?:(\\d+)\\s+([${uni}]))|^(?:(\\d+)\\s*\\/\\s*(\\d+))|^(\\d+(?:\\.\\d+)?)|^([${uni}])`,
  )
  const m = s.match(re)
  if (!m) return null
  let value
  let matched
  if (m[1] && m[2]) {
    value = Number(m[1]) + FRACTIONS[m[2]]
    matched = m[0]
  } else if (m[3] && m[4]) {
    value = Number(m[3]) / Number(m[4])
    matched = m[0]
  } else if (m[5]) {
    value = Number(m[5])
    matched = m[5]
  } else if (m[6]) {
    value = FRACTIONS[m[6]]
    matched = m[6]
  }
  return { value, length: matched.length }
}

function smartCase(s) {
  if (!s) return s
  if (s === s.toLowerCase()) return s[0].toUpperCase() + s.slice(1)
  if (s === s.toUpperCase())
    return s
      .toLowerCase()
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ')
  return s
}

function cleanIngredientName(raw) {
  if (!raw) return { name: raw, parsedAmount: null, parsedUnit: null }
  let s = raw.replace(/\s+/g, ' ').trim()
  let parsedAmount = null
  let parsedUnit = null

  // Peel prefixes iteratively until the string stops changing. Each pass
  // tries: leading punctuation → leading number → leading unit → leading
  // "of"/"de" (sometimes they're interleaved, e.g. "1 _ Oz. Lime Juice").
  let guard = 0
  while (guard++ < 6) {
    const before = s

    // Strip any stray leading punctuation
    s = s.replace(/^[_\-.·:;|]+\s*/, '')

    // Leading number — but bail if it's a range like "3-4"
    const num = parseLeadingNumber(s)
    if (num) {
      const rest = s.slice(num.length)
      if (!/^\s*-\s*\d/.test(rest)) {
        if (parsedAmount == null) parsedAmount = num.value
        s = rest.trimStart()
      }
    }

    // Leading unit word (oz, ml, dash, pinch, …)
    const unitMatch = s.match(UNIT_RE)
    if (unitMatch) {
      if (!parsedUnit) parsedUnit = unitMatch[1].toLowerCase().replace(/\s+/g, ' ')
      s = s.slice(unitMatch[0].length).trimStart()
    }

    // Leading "of " / "de " (English + Spanish)
    const ofMatch = s.match(/^(of|de)\s+/i)
    if (ofMatch) s = s.slice(ofMatch[0].length)

    if (s === before) break
  }

  // Strip trailing punctuation
  s = s.replace(/[.,;]+$/g, '').trim()

  return { name: smartCase(s), parsedAmount, parsedUnit }
}

// ─── fetch all cocktail_ingredients in pages ──────────────────────────
let all = []
const pageSize = 1000
for (let from = 0; ; from += pageSize) {
  const to = from + pageSize - 1
  const { data, error } = await admin
    .from('cocktail_ingredients')
    .select('id, custom_name, amount, amount_text, unit, global_ingredient_id, workspace_ingredient_id, global_product_id')
    .range(from, to)
  if (error) { console.error('! fetch failed:', error.message); process.exit(1) }
  if (!data || data.length === 0) break
  all = all.concat(data)
  if (data.length < pageSize) break
}
console.log(`→ scanning ${all.length} cocktail_ingredients rows`)

// ─── diff + plan updates ─────────────────────────────────────────────
const updates = []
for (const row of all) {
  // Only touch free-text custom names. Rows that already resolve via a
  // FK (global_ingredient_id / workspace_ingredient_id / global_product_id)
  // are considered canonical — leave them.
  if (row.global_ingredient_id || row.workspace_ingredient_id || row.global_product_id) continue
  if (!row.custom_name) continue

  const { name, parsedAmount, parsedUnit } = cleanIngredientName(row.custom_name)
  if (!name) continue

  const patch = {}
  if (name !== row.custom_name) patch.custom_name = name

  // Only backfill amount/unit when they were empty — respect existing data.
  if (parsedAmount != null && (row.amount == null || Number.isNaN(Number(row.amount)))) {
    patch.amount = parsedAmount
  }
  if (parsedUnit && (!row.unit || !row.unit.trim())) {
    // Normalize common plurals to singular
    const normalized = parsedUnit
      .replace(/^dashes$/, 'dash')
      .replace(/^drops$/, 'drop')
      .replace(/^splashes$/, 'splash')
      .replace(/^slices$/, 'slice')
      .replace(/^sprigs$/, 'sprig')
      .replace(/^leaves$/, 'leaf')
      .replace(/^wedges$/, 'wedge')
      .replace(/^cubes$/, 'cube')
      .replace(/^twists$/, 'twist')
      .replace(/^pieces$/, 'piece')
      .replace(/^pcs$/, 'piece')
      .replace(/^tsps$/, 'tsp')
      .replace(/^tbsps$/, 'tbsp')
      .replace(/^teaspoons?$/, 'tsp')
      .replace(/^tablespoons?$/, 'tbsp')
      .replace(/^barspoons?$/, 'barspoon')
      .replace(/^bar spoons?$/, 'barspoon')
      .replace(/^grams?$/, 'g')
      .replace(/^gr$/, 'g')
    patch.unit = normalized
  }

  if (Object.keys(patch).length > 0) updates.push({ id: row.id, patch })
}

console.log(`→ ${updates.length} rows need cleanup`)

if (DRY) {
  for (const u of updates.slice(0, 30)) console.log('  ', u.id, u.patch)
  console.log(`(dry run — no writes. ${updates.length} total)`)
  process.exit(0)
}

// ─── apply in batches ────────────────────────────────────────────────
let ok = 0
let fail = 0
for (const u of updates) {
  const { error } = await admin
    .from('cocktail_ingredients')
    .update(u.patch)
    .eq('id', u.id)
  if (error) {
    fail++
    console.error('!', u.id, error.message)
  } else {
    ok++
  }
  if ((ok + fail) % 200 === 0) console.log(`  … ${ok + fail}/${updates.length}`)
}

console.log(`\n✓ ${ok} updated · ${fail} failed`)
