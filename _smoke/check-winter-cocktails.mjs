// Check which PDF cocktails already exist vs need seeding.
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

const pdfSlugs = [
  'rococo', 'crimson', 'mizunara-sour',
  'fake-sauvignon', 'winter-is-coming', 'lemon-hot-toddy',
  'winter-flower', 'mountain-leaf', 'dragones-velvet',
  'honey-sparkle', 'dragones-sunset', 'manzana-confitada',
]

const { data: existing } = await admin
  .from('cocktails')
  .select('slug, name')
  .eq('workspace_id', ws.id)
  .in('slug', pdfSlugs)

const existingSet = new Set((existing ?? []).map((c) => c.slug))
console.log('Existing:', [...existingSet].sort())
console.log('Missing:', pdfSlugs.filter((s) => !existingSet.has(s)))

const { data: products } = await admin
  .from('global_products')
  .select('id, brand, expression')
  .eq('brand', 'Casa Dragones')
console.log('\nCasa Dragones products:')
for (const p of products ?? []) console.log(`  ${p.expression} (${p.id})`)

const { data: creators } = await admin
  .from('creators')
  .select('id, name')
  .eq('workspace_id', ws.id)
  .is('deleted_at', null)
  .order('name')
console.log('\nCreators:')
for (const c of creators ?? []) console.log(`  ${c.name}`)
