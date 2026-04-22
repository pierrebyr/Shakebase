import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type UploadedImage = { url: string; path: string }

// Server-side hard cap on upload size. The client compresses to ~500 KB so
// any payload bigger than this is either a bug or an abuse attempt — reject
// before streaming bytes to storage.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // 4 MB

// Decode a "data:image/png;base64,AAA..." URL and upload to the given bucket.
// Returns the public URL + path. Buckets must be public-read.
export async function uploadDataUrl(
  bucket: string,
  pathPrefix: string,
  dataUrl: string,
): Promise<UploadedImage> {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/)
  if (!match) throw new Error('Invalid image data URL')
  const contentType = match[1]!
  const base64 = match[2]!
  const bytes = Uint8Array.from(Buffer.from(base64, 'base64'))
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Image too large (${Math.round(bytes.byteLength / 1024 / 1024)} MB). ` +
        `Max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB after compression.`,
    )
  }
  const ext = contentType.split('/')[1]?.split(';')[0] ?? 'bin'
  const path = `${pathPrefix}-${Date.now()}.${ext}`

  const admin = createAdminClient()
  const { error } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: false,
  })
  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = admin.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function deleteByPublicUrl(bucket: string, publicUrl: string | null): Promise<void> {
  if (!publicUrl) return
  // Public URL shape: {supabase_url}/storage/v1/object/public/{bucket}/{path}
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  const admin = createAdminClient()
  await admin.storage.from(bucket).remove([path])
}
