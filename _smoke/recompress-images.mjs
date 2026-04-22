// Recompress every image already in Supabase Storage.
//
// One-shot migration after we added client-side compression for NEW uploads.
// Walks each public bucket, downloads every object, re-encodes to JPEG at
// 1600 px max edge / quality 82, and replaces the original if the result
// is meaningfully smaller.
//
// Idempotent: runs can be repeated safely. Objects that are already near
// our target size are skipped.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node _smoke/recompress-images.mjs [--dry-run]
//
// Or source the env from .env.local and run:
//   source <(grep -E '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=' .env.local | sed 's/^NEXT_PUBLIC_//')
//   node _smoke/recompress-images.mjs

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing env. Need SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.',
  )
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')

const BUCKETS = ['cocktail-images', 'creator-photos', 'product-images']
const MAX_EDGE = 1600
const QUALITY = 82
// Skip objects already small enough — no point re-encoding a 150 KB file.
const SKIP_IF_UNDER_BYTES = 300 * 1024
// Only rewrite if we saved at least this much.
const MIN_SAVINGS_BYTES = 50 * 1024

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// Supabase storage .list() is non-recursive — it returns objects in ONE
// directory. Walk recursively so we hit every file under nested prefixes
// like `<workspace_id>/<slug>-123.jpg`.
async function listAll(bucket, prefix = '') {
  const out = []
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) {
    console.error(`  ✗ list ${bucket}/${prefix} failed:`, error.message)
    return out
  }
  for (const entry of data ?? []) {
    // A "folder" entry from list() has null id + null metadata.
    if (entry.id == null && entry.metadata == null) {
      const nested = await listAll(bucket, prefix ? `${prefix}/${entry.name}` : entry.name)
      out.push(...nested)
    } else {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      out.push({ path, size: entry.metadata?.size ?? 0 })
    }
  }
  return out
}

async function processBucket(bucket) {
  console.log(`\n── Bucket: ${bucket} ${DRY_RUN ? '(dry run)' : ''} ──`)
  const files = await listAll(bucket)
  console.log(`  Found ${files.length} object(s).`)

  let touched = 0
  let saved = 0
  let skipped = 0
  let errors = 0

  for (const f of files) {
    const isImage = /\.(jpe?g|png|webp|avif|heic|gif)$/i.test(f.path)
    if (!isImage) {
      skipped++
      continue
    }
    if (f.size > 0 && f.size < SKIP_IF_UNDER_BYTES) {
      skipped++
      continue
    }

    try {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(bucket)
        .download(f.path)
      if (dlErr || !blob) {
        console.error(`  ✗ download ${f.path}: ${dlErr?.message ?? 'no data'}`)
        errors++
        continue
      }
      const buf = Buffer.from(await blob.arrayBuffer())
      const beforeSize = buf.byteLength

      const recompressed = await sharp(buf, { failOn: 'truncated' })
        .rotate() // respect EXIF orientation
        .resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer()
      const afterSize = recompressed.byteLength

      if (beforeSize - afterSize < MIN_SAVINGS_BYTES) {
        skipped++
        continue
      }

      if (DRY_RUN) {
        console.log(
          `  ~ ${f.path}  ${fmt(beforeSize)} → ${fmt(afterSize)} (would save ${fmt(beforeSize - afterSize)})`,
        )
        saved += beforeSize - afterSize
        touched++
        continue
      }

      // Overwrite in place (upsert:true). Extension stays the same so existing
      // DB rows pointing at the public URL keep working — even if the source
      // was PNG and we're writing JPEG bytes, the browser reads bytes, not
      // the extension, so it renders fine.
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(f.path, recompressed, {
          contentType: 'image/jpeg',
          upsert: true,
        })
      if (upErr) {
        console.error(`  ✗ upload ${f.path}: ${upErr.message}`)
        errors++
        continue
      }

      console.log(
        `  ✓ ${f.path}  ${fmt(beforeSize)} → ${fmt(afterSize)}  (saved ${fmt(beforeSize - afterSize)})`,
      )
      saved += beforeSize - afterSize
      touched++
    } catch (err) {
      console.error(`  ✗ ${f.path}: ${err instanceof Error ? err.message : err}`)
      errors++
    }
  }

  console.log(
    `  Done. Touched ${touched}, skipped ${skipped}, errors ${errors}. Total saved: ${fmt(saved)}.`,
  )
  return { touched, saved, errors, skipped }
}

let grandTouched = 0
let grandSaved = 0
let grandErrors = 0

for (const bucket of BUCKETS) {
  const r = await processBucket(bucket)
  grandTouched += r.touched
  grandSaved += r.saved
  grandErrors += r.errors
}

console.log(
  `\n━━━ Total: rewrote ${grandTouched} object(s), saved ${fmt(grandSaved)}, ${grandErrors} error(s). ${DRY_RUN ? '(DRY RUN — nothing was written)' : ''}`,
)
