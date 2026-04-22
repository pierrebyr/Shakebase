// Upload hero image for the Crypto Tonic cocktail.
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const IMG = '/Users/pierrebouyer/Downloads/casa-dragones-blanco-crypto-tonic-cocktail-PB.jpg'

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
if (!ws) {
  console.error('No workspace casa-dragones')
  process.exit(1)
}

const { data: cocktail } = await admin
  .from('cocktails')
  .select('id, slug, name, image_url')
  .eq('workspace_id', ws.id)
  .ilike('name', 'Crypto Tonic')
  .maybeSingle()

if (!cocktail) {
  console.error('! Crypto Tonic not found in Casa Dragones workspace')
  process.exit(1)
}
console.log(`→ ${cocktail.name} (${cocktail.slug})`)

const bytes = await readFile(IMG)
const path = `${ws.id}/${cocktail.slug}-${Date.now()}.jpg`
const { error: upErr } = await admin.storage
  .from('cocktail-images')
  .upload(path, bytes, { contentType: 'image/jpeg', upsert: false })
if (upErr) {
  console.error('! upload failed:', upErr.message)
  process.exit(1)
}

const { data: pub } = admin.storage.from('cocktail-images').getPublicUrl(path)
const url = pub.publicUrl

const { error: updErr } = await admin
  .from('cocktails')
  .update({ image_url: url, images: [url] })
  .eq('id', cocktail.id)
if (updErr) {
  console.error('! update failed:', updErr.message)
  process.exit(1)
}

// Clean up previous image
const prev = cocktail.image_url
if (prev && prev !== url && prev.includes('/cocktail-images/')) {
  const prevPath = prev.split('/cocktail-images/')[1]
  if (prevPath) await admin.storage.from('cocktail-images').remove([prevPath]).catch(() => {})
}

console.log(`✓ Crypto Tonic image updated · ${Math.round(bytes.byteLength / 1024)} KB`)
