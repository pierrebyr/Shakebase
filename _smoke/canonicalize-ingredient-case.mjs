// Normalize case on cocktail_ingredients.custom_name so variants like
// "Lime Juice" / "Lime juice" / "LIME JUICE" all become the same string.
// Rule: Title Case, except small words (of, the, in, y, de…) stay lowercase
// unless they're the first word.
//
// Idempotent. Run: node --env-file=.env.local _smoke/canonicalize-ingredient-case.mjs

import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry')

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const SMALLS = new Set([
  'of', 'and', 'the', 'a', 'an', 'in', 'on', 'for', 'with', 'to', 'or',
  'de', 'la', 'le', 'du', 'y', 'o', 'en', 'al',
])

function titleCase(s) {
  if (!s) return s
  const lower = s.toLowerCase()
  return lower.replace(/(^|[\s-])([a-z0-9áéíóúñü'’]+)/gi, (full, sep, word) => {
    if (sep && SMALLS.has(word)) return sep + word
    return sep + word[0].toUpperCase() + word.slice(1)
  })
}

// ─── fetch all custom_name rows ──────────────────────────────────────
let all = []
const pageSize = 1000
for (let from = 0; ; from += pageSize) {
  const { data, error } = await admin
    .from('cocktail_ingredients')
    .select('id, custom_name, global_ingredient_id, workspace_ingredient_id, global_product_id')
    .range(from, from + pageSize - 1)
  if (error) { console.error('! fetch failed:', error.message); process.exit(1) }
  if (!data || data.length === 0) break
  all = all.concat(data)
  if (data.length < pageSize) break
}
console.log(`→ scanning ${all.length} rows`)

const updates = []
for (const row of all) {
  if (row.global_ingredient_id || row.workspace_ingredient_id || row.global_product_id) continue
  if (!row.custom_name) continue
  const canonical = titleCase(row.custom_name)
  if (canonical !== row.custom_name) {
    updates.push({ id: row.id, before: row.custom_name, after: canonical })
  }
}

console.log(`→ ${updates.length} rows to canonicalize`)

if (DRY) {
  for (const u of updates.slice(0, 40)) console.log(`   "${u.before}" → "${u.after}"`)
  if (updates.length > 40) console.log(`   (… ${updates.length - 40} more)`)
  process.exit(0)
}

let ok = 0, fail = 0
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
