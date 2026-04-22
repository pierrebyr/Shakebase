// Upload HD hero images extracted from the Winter Craft Cocktails PDF
// for the 5 newly seeded cocktails.
// Run: node --env-file=.env.local _smoke/upload-winter-v2-images.mjs

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const PDF_CACHE = '/Users/pierrebouyer/Documents/Code/Shakebase V3/_smoke/pdf-winter-images'

const MAPPING = [
  { slug: 'crimson', file: `${PDF_CACHE}/img-002-003.jpg` },
  { slug: 'mountain-leaf', file: `${PDF_CACHE}/img-004-011.jpg` },
  { slug: 'honey-sparkle', file: `${PDF_CACHE}/img-005-014.jpg` },
  { slug: 'dragones-sunset', file: `${PDF_CACHE}/img-005-015.jpg` },
  { slug: 'manzana-confitada', file: `${PDF_CACHE}/img-005-016.jpg` },
]

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

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

for (const { slug, file } of MAPPING) {
  const { data: cocktail } = await admin
    .from('cocktails')
    .select('id, name, image_url')
    .eq('workspace_id', ws.id)
    .eq('slug', slug)
    .maybeSingle()
  if (!cocktail) {
    console.warn(`! skip ${slug} — cocktail not found`)
    continue
  }

  const bytes = await readFile(file)
  const path = `${ws.id}/${slug}-${Date.now()}.jpg`

  const { error: uploadErr } = await admin.storage
    .from('cocktail-images')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: false })
  if (uploadErr) {
    console.error(`! upload failed for ${slug}:`, uploadErr.message)
    continue
  }

  const { data: pub } = admin.storage.from('cocktail-images').getPublicUrl(path)
  const url = pub.publicUrl

  const { error: updErr } = await admin
    .from('cocktails')
    .update({ image_url: url, images: [url] })
    .eq('id', cocktail.id)
  if (updErr) {
    console.error(`! update failed for ${slug}:`, updErr.message)
    continue
  }

  const prev = cocktail.image_url
  if (prev && prev !== url && prev.includes('/cocktail-images/')) {
    const prevPath = prev.split('/cocktail-images/')[1]
    if (prevPath) {
      await admin.storage
        .from('cocktail-images')
        .remove([prevPath])
        .catch(() => {})
    }
  }

  console.log(`+ ${cocktail.name} · ${Math.round(bytes.byteLength / 1024)} KB`)
}

console.log('\n✓ done')
