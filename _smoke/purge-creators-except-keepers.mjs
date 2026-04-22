// Remove every creator in Casa Dragones except:
//   · José Luis León
//   · Pujol Bar Team
//   · Yana Volfson
//   · Jim Meehan
//
// Uses soft-delete (deleted_at = NOW()) so rows are recoverable.
// Run: node --env-file=.env.local _smoke/purge-creators-except-keepers.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const KEEP = ['José Luis León', 'Pujol Bar Team', 'Yana Volfson', 'Jim Meehan']

const { data: ws } = await admin
  .from('workspaces')
  .select('id, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!ws) {
  console.error('No workspace "casa-dragones"')
  process.exit(1)
}
console.log(`→ workspace ${ws.name}`)

const { data: all } = await admin
  .from('creators')
  .select('id, name')
  .eq('workspace_id', ws.id)
  .is('deleted_at', null)
console.log(`→ found ${all?.length ?? 0} live creators`)

const toDelete = (all ?? []).filter((c) => !KEEP.includes(c.name))
const kept = (all ?? []).filter((c) => KEEP.includes(c.name))

console.log(`→ keeping ${kept.length}:`)
for (const c of kept) console.log(`   · ${c.name}`)

if (toDelete.length === 0) {
  console.log('Nothing to remove.')
  process.exit(0)
}

console.log(`→ soft-deleting ${toDelete.length} creators:`)
for (const c of toDelete) console.log(`   · ${c.name}`)

// First: null-out creator_id on any cocktails attributed to them (so the
// cocktails don't render "by <deleted>" after the filter removes them).
const deleteIds = toDelete.map((c) => c.id)
const { error: updCocktails } = await admin
  .from('cocktails')
  .update({ creator_id: null })
  .in('creator_id', deleteIds)
if (updCocktails) {
  console.warn('! cocktails creator_id clear failed:', updCocktails.message)
}

// Soft delete the creators themselves.
const { error: delErr, count } = await admin
  .from('creators')
  .update({ deleted_at: new Date().toISOString() }, { count: 'exact' })
  .in('id', deleteIds)
if (delErr) {
  console.error('! delete failed:', delErr.message)
  process.exit(1)
}
console.log(`✓ soft-deleted ${count ?? toDelete.length} creators`)

const { data: after } = await admin
  .from('creators')
  .select('name')
  .eq('workspace_id', ws.id)
  .is('deleted_at', null)
  .order('name')
console.log(`\n→ remaining live creators: ${after?.length ?? 0}`)
for (const c of after ?? []) console.log(`   · ${c.name}`)
