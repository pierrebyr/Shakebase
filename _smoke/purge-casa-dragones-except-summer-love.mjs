// Remove every Casa Dragones cocktail except "Stuck in a Summer Love".
// Hard delete (not soft) because cocktails use status='archived' elsewhere
// for soft delete and here we want the rows gone.
//
// Run: node --env-file=.env.local _smoke/purge-casa-dragones-except-summer-love.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: ws, error: wsErr } = await admin
  .from('workspaces')
  .select('id, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (wsErr || !ws) {
  console.error('No workspace "casa-dragones":', wsErr?.message)
  process.exit(1)
}
console.log(`→ workspace ${ws.name}`)

const { data: toKeep } = await admin
  .from('cocktails')
  .select('id, name, slug')
  .eq('workspace_id', ws.id)
  .ilike('name', '%summer love%')
if (!toKeep || toKeep.length === 0) {
  console.error('Could not find "Stuck in a Summer Love" — aborting so we don\'t wipe everything.')
  process.exit(1)
}
console.log(`→ keeping ${toKeep.length} cocktail(s):`, toKeep.map((c) => `${c.name} (${c.slug})`).join(', '))
const keepIds = toKeep.map((c) => c.id)

const { data: targets } = await admin
  .from('cocktails')
  .select('id, name, slug, image_url')
  .eq('workspace_id', ws.id)
  .not('id', 'in', `(${keepIds.join(',')})`)

const toDelete = targets ?? []
if (toDelete.length === 0) {
  console.log('Nothing to delete.')
  process.exit(0)
}
console.log(`→ will delete ${toDelete.length} cocktails:`)
for (const c of toDelete) console.log(`   · ${c.name} (${c.slug})`)

// Delete cocktail_ingredients first (FK cascade should handle but be explicit).
const deleteIds = toDelete.map((c) => c.id)
const { error: ingErr } = await admin
  .from('cocktail_ingredients')
  .delete()
  .in('cocktail_id', deleteIds)
if (ingErr) {
  console.error('Ingredient delete failed:', ingErr.message)
  process.exit(1)
}
console.log(`→ cleared cocktail_ingredients`)

// Delete from collection_cocktails link table too.
const { error: colErr } = await admin
  .from('collection_cocktails')
  .delete()
  .in('cocktail_id', deleteIds)
if (colErr) {
  console.error('Collection link delete failed:', colErr.message)
  // non-fatal
}

// Delete any orphaned images from storage.
const imagePaths = toDelete
  .map((c) => c.image_url)
  .filter((u) => typeof u === 'string' && u.includes('/cocktail-images/'))
  .map((u) => u.split('/cocktail-images/')[1])
  .filter(Boolean)
if (imagePaths.length > 0) {
  const { error: storageErr } = await admin.storage.from('cocktail-images').remove(imagePaths)
  if (storageErr) console.warn('Storage cleanup warning:', storageErr.message)
  else console.log(`→ removed ${imagePaths.length} image file(s) from storage`)
}

// Delete the cocktails themselves.
const { error: delErr, count } = await admin
  .from('cocktails')
  .delete({ count: 'exact' })
  .eq('workspace_id', ws.id)
  .in('id', deleteIds)
if (delErr) {
  console.error('Delete failed:', delErr.message)
  process.exit(1)
}
console.log(`✓ deleted ${count} cocktails`)

// Final sanity check
const { data: remaining } = await admin
  .from('cocktails')
  .select('id, name, slug, status')
  .eq('workspace_id', ws.id)
console.log(`→ remaining in workspace: ${remaining?.length ?? 0}`)
for (const c of remaining ?? []) console.log(`   · ${c.name} (${c.slug}) [${c.status}]`)
