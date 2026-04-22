// Create a public product-images bucket if needed, then upload 5 Casa Dragones
// product shots and link them to the global_products records.
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// Ensure bucket exists
const { data: buckets } = await admin.storage.listBuckets()
if (!buckets.find((b) => b.name === 'product-images')) {
  const { error } = await admin.storage.createBucket('product-images', { public: true })
  if (error) {
    console.error('! bucket create failed:', error.message)
    process.exit(1)
  }
  console.log('+ created product-images bucket')
}

const MAPPING = [
  { expression: 'Blanco', file: '/Users/pierrebouyer/Downloads/casa-dragones-blanco.png' },
  { expression: 'Joven', file: '/Users/pierrebouyer/Downloads/casa-dragones-joven.png' },
  { expression: 'Añejo Barrel Blend', file: '/Users/pierrebouyer/Downloads/casa-dragones-anejo-barrel-blend.png' },
  { expression: 'Reposado Mizunara', file: '/Users/pierrebouyer/Downloads/casa-dragones-reposado-mizunara.png' },
  { expression: '200 Copas', file: '/Users/pierrebouyer/Downloads/200-copas-by-casa-dragones.png' },
]

for (const { expression, file } of MAPPING) {
  const { data: product } = await admin
    .from('global_products')
    .select('id, image_url')
    .eq('brand', 'Casa Dragones')
    .eq('expression', expression)
    .maybeSingle()
  if (!product) {
    console.warn(`! ${expression} not found`)
    continue
  }

  const bytes = await readFile(file)
  const slug = expression.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const path = `casa-dragones/${slug}-${Date.now()}.png`

  const { error: upErr } = await admin.storage
    .from('product-images')
    .upload(path, bytes, { contentType: 'image/png', upsert: false })
  if (upErr) {
    console.error(`! upload failed for ${expression}:`, upErr.message)
    continue
  }
  const { data: pub } = admin.storage.from('product-images').getPublicUrl(path)

  await admin.from('global_products').update({ image_url: pub.publicUrl }).eq('id', product.id)

  // Clean up previous image if any
  const prev = product.image_url
  if (prev && prev.includes('/product-images/')) {
    const prevPath = prev.split('/product-images/')[1]
    if (prevPath) await admin.storage.from('product-images').remove([prevPath]).catch(() => {})
  }

  console.log(`+ ${expression} · ${Math.round(bytes.byteLength / 1024)} KB`)
}

console.log('\n✓ product images uploaded')
