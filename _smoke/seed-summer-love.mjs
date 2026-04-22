// Seed "Stuck in a Summer Love" cocktail into Casa Dragones workspace.
// Downloads the reference image, uploads to Supabase Storage, links the
// Casa Dragones Blanco global product, stores ingredients with amount_text.
//
// Run: node --env-file=.env.local _smoke/seed-summer-love.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── 1. Locate workspace ────────────────────────────────────────────────
const { data: ws } = await admin
  .from('workspaces')
  .select('id, owner_user_id, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!ws) {
  console.error('No workspace "casa-dragones" found')
  process.exit(1)
}
console.log(`→ workspace ${ws.name}`)

// ─── 2. Download + upload hero image ───────────────────────────────────
const imageUrl =
  'https://i.shgcdn.com/07cd1a72-e3bf-483d-bbd9-590eeb050de9/-/format/auto/-/quality/normal/'
const slug = 'stuck-in-a-summer-love'
const ts = Date.now()

console.log('→ fetching hero image')
const imgRes = await fetch(imageUrl)
if (!imgRes.ok) {
  console.error(`Image fetch failed: ${imgRes.status}`)
  process.exit(1)
}
const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
const ext = contentType.includes('png')
  ? 'png'
  : contentType.includes('webp')
    ? 'webp'
    : contentType.includes('avif')
      ? 'avif'
      : 'jpg'
const bytes = new Uint8Array(await imgRes.arrayBuffer())
console.log(`  ${(bytes.byteLength / 1024).toFixed(1)} KB · ${contentType}`)

const path = `${ws.id}/${slug}-${ts}.${ext}`
console.log(`→ uploading to cocktail-images/${path}`)
const { error: uploadError } = await admin.storage
  .from('cocktail-images')
  .upload(path, bytes, { contentType, upsert: false })
if (uploadError) {
  console.error(`Upload failed: ${uploadError.message}`)
  process.exit(1)
}
const { data: publicUrl } = admin.storage.from('cocktail-images').getPublicUrl(path)
const image_url = publicUrl.publicUrl
console.log(`  ✓ ${image_url}`)

// ─── 3. Resolve referenced global rows ─────────────────────────────────
const { data: blanco } = await admin
  .from('global_products')
  .select('id')
  .eq('brand', 'Casa Dragones')
  .eq('expression', 'Blanco')
  .maybeSingle()
if (!blanco) {
  console.error('Casa Dragones Blanco not found in global_products — run seed first')
  process.exit(1)
}

const { data: grapefruit } = await admin
  .from('global_ingredients')
  .select('id')
  .eq('name', 'Grapefruit juice')
  .maybeSingle()

// ─── 4. Insert cocktail ────────────────────────────────────────────────
console.log('→ inserting cocktail')

// Method split by sentence into steps
const methodSteps = [
  {
    step: 1,
    text: 'In a shaker, add Casa Dragones Blanco, Mistela Pijoan and grapefruit juice. Add ice and shake.',
  },
  { step: 2, text: 'Strain into a chilled coupe glass.' },
  { step: 3, text: 'Top with cold lychee soda and cold prosecco.' },
  { step: 4, text: 'Decorate with one clear ice cube, a slice of raspberry, and a dehydrated leaf.' },
]

// Clean up any prior copy to keep the script re-runnable
const { data: prior } = await admin
  .from('cocktails')
  .select('id')
  .eq('workspace_id', ws.id)
  .eq('slug', slug)
  .maybeSingle()
if (prior) {
  await admin.from('cocktails').delete().eq('id', prior.id)
  console.log('  cleared prior copy')
}

const { data: inserted, error: cocktailError } = await admin
  .from('cocktails')
  .insert({
    workspace_id: ws.id,
    slug,
    name: 'Stuck in a Summer Love',
    status: 'published',
    category: 'Spritz',
    spirit_base: 'Tequila',
    base_product_id: blanco.id,
    glass_type: 'Coupe',
    garnish: 'Raspberry slice · dehydrated leaf · clear ice cube',
    tasting_notes:
      'Crisp agave up front, rose-tinged pink vermouth through the midpalate, bitter grapefruit and floral lychee on the bridge, finished bone-dry by the prosecco lift. Summery and reflective.',
    flavor_profile: ['Citrus', 'Floral', 'Tropical', 'Sweet'],
    season: ['Summer'],
    occasions: ['Everyday', 'Apéritif'],
    orb_from: '#ffd3df',
    orb_to: '#d95b82',
    image_url,
    method_steps: methodSteps,
    created_by: ws.owner_user_id,
    featured: true,
  })
  .select('id')
  .single()

if (cocktailError || !inserted) {
  console.error(cocktailError)
  process.exit(1)
}
console.log(`  ✓ cocktail ${inserted.id}`)

// ─── 5. Insert ingredients ─────────────────────────────────────────────
console.log('→ inserting ingredients')
const rows = [
  {
    position: 1,
    global_product_id: blanco.id,
    custom_name: null,
    amount: 1,
    unit: 'oz',
    amount_text: '1 oz',
  },
  {
    position: 2,
    custom_name: 'Mistela Pijoan (sweet pink vermouth)',
    amount: 1,
    unit: 'oz',
    amount_text: '1 oz',
  },
  {
    position: 3,
    global_ingredient_id: grapefruit?.id ?? null,
    custom_name: grapefruit?.id ? null : 'Grapefruit juice',
    amount: 1,
    unit: 'oz',
    amount_text: '1 oz',
  },
  {
    position: 4,
    custom_name: 'Lychee soda',
    amount: 1.5,
    unit: 'oz',
    amount_text: '1 ½ oz',
  },
  {
    position: 5,
    custom_name: 'Prosecco',
    amount: 0.67,
    unit: 'oz',
    amount_text: '⅔ oz',
  },
]

const { error: ingError } = await admin.from('cocktail_ingredients').insert(
  rows.map((r) => ({ cocktail_id: inserted.id, ...r })),
)
if (ingError) {
  console.error(ingError)
  await admin.from('cocktails').delete().eq('id', inserted.id)
  process.exit(1)
}

console.log('\n✅ Summer Love seeded.')
console.log(`   url: http://casa-dragones.lvh.me:3000/cocktails/${inserted.id}`)
