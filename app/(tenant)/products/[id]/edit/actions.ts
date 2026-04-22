'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'

type GlobalPatch = {
  brand?: string
  expression?: string
  category?: string
  abv?: number | null
  origin?: string | null
  tagline?: string | null
  description?: string | null
  tasting_notes?: string | null
  volume_ml?: number | null
  color_hex?: string | null
  provenance?: Record<string, string> | null
}

type WorkspacePatch = {
  stock?: number | null
  par?: number | null
  cost_cents?: number | null
  menu_price_cents?: number | null
}

export async function saveProductAction(
  workspaceProductId: string,
  globalProductId: string,
  globalPatch: GlobalPatch,
  workspacePatch: WorkspacePatch,
): Promise<{ ok: true } | { ok?: undefined; error: string }> {
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Global product update (brand-level info). Only super-admins can mutate
  // the shared catalog — regular tenants only write to workspace_products.
  // Silently drop any globalPatch fields if the user isn't a super-admin,
  // so the UI doesn't have to know about the gate; nothing persists.
  if (Object.keys(globalPatch).length > 0) {
    const user = await getUser()
    if (!user) return { error: 'Not signed in' }

    const adminClient = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = adminClient as any
    const { data: sa } = await adminDb
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!sa) {
      return {
        error:
          'Brand-level fields are shared across workspaces and can only be edited by the catalog admin.',
      }
    }

    const { error } = await db
      .from('global_products')
      .update(globalPatch)
      .eq('id', globalProductId)
    if (error) return { error: error.message }
  }

  // Workspace product update (tenant-specific stock/pricing)
  if (Object.keys(workspacePatch).length > 0) {
    const { error } = await db
      .from('workspace_products')
      .update(workspacePatch)
      .eq('id', workspaceProductId)
      .eq('workspace_id', workspace.id)
    if (error) return { error: error.message }
  }

  revalidatePath('/products')
  revalidatePath(`/products/${workspaceProductId}/edit`)
  return { ok: true }
}

async function assertSuperAdmin(): Promise<
  { ok: true } | { ok?: undefined; error: string }
> {
  const user = await getUser()
  if (!user) return { error: 'Not signed in' }
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data: sa } = await db
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!sa) {
    return {
      error:
        'Product images are shared across workspaces and can only be changed by the catalog admin.',
    }
  }
  return { ok: true }
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok?: undefined; url?: undefined; error: string }> {
  const file = formData.get('file') as File
  const globalProductId = formData.get('globalProductId') as string
  if (!file || !globalProductId) return { error: 'Missing file or product id' }

  const gate = await assertSuperAdmin()
  if ('error' in gate) return { error: gate.error }

  const admin = createAdminClient()
  const bytes = Buffer.from(await file.arrayBuffer())
  const extMatch = file.name?.match(/\.([a-z0-9]+)$/i)
  const ext = extMatch?.[1]?.toLowerCase() ?? 'png'
  const path = `uploaded/${globalProductId}-${Date.now()}.${ext}`

  const { error: upErr } = await admin.storage
    .from('product-images')
    .upload(path, bytes, { contentType: file.type || 'image/png', upsert: false })
  if (upErr) return { error: upErr.message }

  const { data: pub } = admin.storage.from('product-images').getPublicUrl(path)
  const url = pub.publicUrl

  // Fetch current image to clean up
  const { data: current } = await admin
    .from('global_products')
    .select('image_url')
    .eq('id', globalProductId)
    .maybeSingle()

  const { error: updErr } = await admin
    .from('global_products')
    .update({ image_url: url })
    .eq('id', globalProductId)
  if (updErr) return { error: updErr.message }

  // Best-effort cleanup of previous image
  const prev = current?.image_url
  if (prev && prev !== url && prev.includes('/product-images/')) {
    const prevPath = prev.split('/product-images/')[1]
    if (prevPath) await admin.storage.from('product-images').remove([prevPath]).catch(() => {})
  }

  revalidatePath('/products')
  return { ok: true, url }
}

export async function removeProductImageAction(
  globalProductId: string,
): Promise<{ ok: true } | { ok?: undefined; error: string }> {
  const gate = await assertSuperAdmin()
  if ('error' in gate) return { error: gate.error }

  const admin = createAdminClient()

  const { data: current } = await admin
    .from('global_products')
    .select('image_url')
    .eq('id', globalProductId)
    .maybeSingle()

  await admin.from('global_products').update({ image_url: null }).eq('id', globalProductId)

  const prev = current?.image_url
  if (prev && prev.includes('/product-images/')) {
    const prevPath = prev.split('/product-images/')[1]
    if (prevPath) await admin.storage.from('product-images').remove([prevPath]).catch(() => {})
  }

  revalidatePath('/products')
  return { ok: true }
}
