'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { uploadDataUrl, deleteByPublicUrl } from '@/lib/storage/upload'
import { slugify } from '@/lib/slug'

type Input = { creatorId: string; dataUrl: string | null }

export async function updateCreatorPhotoAction(
  input: Input,
): Promise<{ ok: boolean; error?: string; url?: string | null }> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const supabase = await createClient()
  const { data: cr } = await supabase
    .from('creators')
    .select('id, name, photo_url')
    .eq('id', input.creatorId)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  if (!cr) return { ok: false, error: 'Creator not found' }

  const current = (cr as { photo_url: string | null }).photo_url
  const name = (cr as { name: string }).name
  const slugName = slugify(name) || 'creator'

  let newUrl: string | null = null
  if (input.dataUrl) {
    try {
      const uploaded = await uploadDataUrl('creator-photos', `${workspace.id}/${slugName}`, input.dataUrl)
      newUrl = uploaded.url
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' }
    }
  }

  const { error } = await supabase
    .from('creators')
    .update({ photo_url: newUrl } as never)
    .eq('id', input.creatorId)
    .eq('workspace_id', workspace.id)
  if (error) return { ok: false, error: error.message }

  if (current && current !== newUrl) {
    try {
      await deleteByPublicUrl('creator-photos', current)
    } catch {
      /* ignore */
    }
  }

  revalidatePath(`/creators/${input.creatorId}`)
  revalidatePath(`/creators/${input.creatorId}/edit`)
  revalidatePath('/creators')
  return { ok: true, url: newUrl }
}
