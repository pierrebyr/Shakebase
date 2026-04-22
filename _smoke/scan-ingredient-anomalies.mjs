// Scan cocktail_ingredients.custom_name for weird patterns.
// Prints grouped findings; no writes.
// Run: node --env-file=.env.local _smoke/scan-ingredient-anomalies.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

let all = []
for (let from = 0; ; from += 1000) {
  const { data } = await admin
    .from('cocktail_ingredients')
    .select('id, custom_name, global_ingredient_id, workspace_ingredient_id, global_product_id')
    .range(from, from + 999)
  if (!data || data.length === 0) break
  all = all.concat(data)
  if (data.length < 1000) break
}

const customRows = all.filter(
  (r) =>
    r.custom_name &&
    !r.global_ingredient_id &&
    !r.workspace_ingredient_id &&
    !r.global_product_id,
)

const buckets = {
  colon: [],            // "Verdita: Pineapple…" (compound)
  slash: [],            // "Lime / Lemon"
  or: [],               // "Wtrmln Wtr or Fresh Watermelon Juice"
  comma: [],            // "Pineapple, Cilantro, Mint" (compound)
  placeholder: [],      // starts with X, TBD, ???
  unitOnly: [],         // starts with Oz, Ml, Dash without a value
  abbreviation: [],     // word with no vowels like "Wtrmln"
  parentheses: [],      // "(something weird)"
  tooShort: [],         // 1-2 char names
  trailingFor: [],      // "X, for garnish"
  digits: [],           // contains stray digits in the middle
  quotedMark: [],       // contains quote marks suggesting annotation
}

const UNIT_WORD_RE = /^(oz|ml|cl|dash|drop|splash|pinch|tsp|tbsp|sprig|leaf|cube|slice|gr|gram|grams|piece|pc|top|float|barspoon)\b/i

for (const r of customRows) {
  const n = r.custom_name
  const low = n.toLowerCase()

  if (n.includes(':')) buckets.colon.push(n)
  else if (n.includes(' / ') || n.includes('/ ') || n.includes(' /')) buckets.slash.push(n)
  else if (/\s+or\s+/i.test(n) && !/liqueur/i.test(low)) buckets.or.push(n)
  else if (n.split(',').length > 2) buckets.comma.push(n)
  else if (UNIT_WORD_RE.test(n) && !/\d/.test(n)) buckets.unitOnly.push(n)
  else if (/^x\b/i.test(n.trim()) || /^(tbd|\?\?\?|todo)/i.test(n.trim())) buckets.placeholder.push(n)
  else if (/^(for\s+garnish|garnish\b)/i.test(n.trim())) buckets.trailingFor.push(n)
  else if (/\([^)]{1,}\)/.test(n) && !/infus|puree|purée|liqueur/i.test(low)) buckets.parentheses.push(n)
  else if (n.trim().length < 3) buckets.tooShort.push(n)
  else if (/,\s*(for|to|as)\s/i.test(n)) buckets.trailingFor.push(n)
  else {
    // abbreviation heuristic — any word ≥4 chars with no vowels (a/e/i/o/u/y)
    const words = n.split(/\s+/)
    const suspicious = words.find(
      (w) => w.length >= 4 && !/[aeiouyáéíóú]/i.test(w.replace(/[^a-z]/gi, '')),
    )
    if (suspicious) buckets.abbreviation.push(n)
  }
}

function uniq(arr) {
  return [...new Set(arr)].sort()
}

let totalIssues = 0
for (const [key, list] of Object.entries(buckets)) {
  const u = uniq(list)
  if (u.length === 0) continue
  totalIssues += list.length
  console.log(`\n━ ${key.toUpperCase()} · ${list.length} rows · ${u.length} distinct`)
  for (const s of u.slice(0, 25)) {
    const count = list.filter((x) => x === s).length
    console.log(`  [${count}] ${JSON.stringify(s)}`)
  }
  if (u.length > 25) console.log(`  … ${u.length - 25} more`)
}

console.log(`\n✓ scanned ${customRows.length} custom rows · ${totalIssues} flagged`)
