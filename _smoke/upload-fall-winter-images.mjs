// Upload hero images for the 10 fall/winter Casa Dragones cocktails.
// Run: node --env-file=.env.local _smoke/upload-fall-winter-images.mjs

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const CACHE = '/Users/pierrebouyer/.claude/image-cache/dddb1a10-1e96-4392-bc22-3b489cf75229'

const MAPPING = [
  { slug: 'la-catrina', file: `${CACHE}/18.png` },
  { slug: 'the-obsidian', file: `${CACHE}/19.png` },
  { slug: 'rococo', file: `${CACHE}/20.png` },
  { slug: 'winter-flower', file: `${CACHE}/21.png` },
  { slug: 'fake-sauvignon', file: `${CACHE}/22.png` },
  { slug: 'dragones-velvet', file: `${CACHE}/23.png` },
  { slug: 'crypto-tonic', file: `${CACHE}/24.png` },
  { slug: 'winter-is-coming', file: `${CACHE}/25.png` },
  { slug: 'mizunara-sour', file: `${CACHE}/26.png` },
  { slug: 'lemon-hot-toddy', file: `${CACHE}/27.png` },
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
  const path = `${ws.id}/${slug}-${Date.now()}.png`

  const { error: uploadErr } = await admin.storage
    .from('cocktail-images')
    .upload(path, bytes, { contentType: 'image/png', upsert: false })
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

  // Clean up previous hero.
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
