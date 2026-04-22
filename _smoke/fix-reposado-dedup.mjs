// Merge the duplicate "Casa Dragones Reposado" into "Casa Dragones Reposado Mizunara"
// (they're the same product). Repoints any cocktail or ingredient row
// that references the duplicate, then deletes it.
// Run: node --env-file=.env.local _smoke/fix-reposado-dedup.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: dup } = await admin
  .from('global_products')
  .select('id')
  .eq('brand', 'Casa Dragones')
  .eq('expression', 'Reposado')
  .maybeSingle()

const { data: real } = await admin
  .from('global_products')
  .select('id')
  .eq('brand', 'Casa Dragones')
  .eq('expression', 'Reposado Mizunara')
  .maybeSingle()

if (!real) {
  console.error('! Reposado Mizunara missing — aborting')
  process.exit(1)
}
if (!dup) {
  console.log('· no duplicate to remove')
  process.exit(0)
}

console.log(`→ duplicate  ${dup.id}`)
console.log(`→ canonical  ${real.id}`)

// Re-point cocktails.base_product_id
const { data: c1, error: e1 } = await admin
  .from('cocktails')
  .update({ base_product_id: real.id })
  .eq('base_product_id', dup.id)
  .select('id, name')
if (e1) {
  console.error('! cocktails update failed:', e1.message)
  process.exit(1)
}
for (const r of c1 ?? []) console.log(`  cocktail → ${r.name}`)

// Re-point cocktail_ingredients.global_product_id
const { data: i1, error: e2 } = await admin
  .from('cocktail_ingredients')
  .update({ global_product_id: real.id })
  .eq('global_product_id', dup.id)
  .select('id')
if (e2) {
  console.error('! ingredients update failed:', e2.message)
  process.exit(1)
}
console.log(`  ingredients repointed: ${i1?.length ?? 0}`)

// Drop the duplicate
const { error: e3 } = await admin.from('global_products').delete().eq('id', dup.id)
if (e3) {
  console.error('! delete failed:', e3.message)
  process.exit(1)
}
console.log('✓ duplicate removed')
