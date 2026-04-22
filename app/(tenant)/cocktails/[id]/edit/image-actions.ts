'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { uploadDataUrl, deleteByPublicUrl } from '@/lib/storage/upload'

type SingleInput = { cocktailId: string; dataUrl: string | null }
type AddInput = { cocktailId: string; dataUrl: string }
type RemoveInput = { cocktailId: string; url: string }

type SuccessPayload = { ok: true; error?: undefined; url?: string | null; images?: string[] }
type Failure = { ok: false; error: string }
type Result = SuccessPayload | Failure

async function loadCocktail(
  cocktailId: string,
  workspaceId: string,
): Promise<{ slug: string; image_url: string | null; images: string[] } | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cocktails')
    .select('slug, image_url, images')
    .eq('id', cocktailId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  if (!data) return null
  const row = data as { slug: string; image_url: string | null; images: string[] | null }
  return {
    slug: row.slug,
    image_url: row.image_url,
    images: row.images ?? [],
  }
}

async function persistImages(
  cocktailId: string,
  workspaceId: string,
  nextImages: string[],
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cocktails')
    .update({
      images: nextImages,
      image_url: nextImages[0] ?? null,
    } as never)
    .eq('id', cocktailId)
    .eq('workspace_id', workspaceId)
  return { error: error?.message ?? null }
}

function invalidate(_cocktailId: string): void {
  // Route is now slug-based; since we only have the id here, invalidate the
  // whole /cocktails subtree instead of looking up the slug.
  revalidatePath('/cocktails', 'layout')
}

// Replaces (or clears) the PRIMARY image. images[0] is overwritten; the
// rest of the gallery is preserved.
export async function updateCocktailImageAction(input: SingleInput): Promise<Result> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const cocktail = await loadCocktail(input.cocktailId, workspace.id)
  if (!cocktail) return { ok: false, error: 'Cocktail not found' }

  let newPrimary: string | null = null
  if (input.dataUrl) {
    try {
      const uploaded = await uploadDataUrl(
        'cocktail-images',
        `${workspace.id}/${cocktail.slug}`,
        input.dataUrl,
      )
      newPrimary = uploaded.url
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' }
    }
  }

  const previousPrimary = cocktail.images[0] ?? cocktail.image_url
  const rest = cocktail.images.slice(1)
  const nextImages = newPrimary ? [newPrimary, ...rest] : rest

  const { error } = await persistImages(input.cocktailId, workspace.id, nextImages)
  if (error) return { ok: false, error }

  if (previousPrimary && previousPrimary !== newPrimary) {
    try {
      await deleteByPublicUrl('cocktail-images', previousPrimary)
    } catch {
      /* ignore */
    }
  }

  invalidate(input.cocktailId)
  return { ok: true, url: newPrimary, images: nextImages }
}

// Append a new photo to the gallery. Cap at 6.
export async function addCocktailImageAction(input: AddInput): Promise<Result> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const cocktail = await loadCocktail(input.cocktailId, workspace.id)
  if (!cocktail) return { ok: false, error: 'Cocktail not found' }
  if (cocktail.images.length >= 6) {
    return { ok: false, error: 'Max 6 photos per cocktail.' }
  }

  let uploadedUrl: string
  try {
    const uploaded = await uploadDataUrl(
      'cocktail-images',
      `${workspace.id}/${cocktail.slug}`,
      input.dataUrl,
    )
    uploadedUrl = uploaded.url
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' }
  }

  const nextImages = [...cocktail.images, uploadedUrl]
  const { error } = await persistImages(input.cocktailId, workspace.id, nextImages)
  if (error) return { ok: false, error }

  invalidate(input.cocktailId)
  return { ok: true, url: uploadedUrl, images: nextImages }
}

// Remove a specific photo from the gallery and from storage.
export async function removeCocktailImageAction(input: RemoveInput): Promise<Result> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const cocktail = await loadCocktail(input.cocktailId, workspace.id)
  if (!cocktail) return { ok: false, error: 'Cocktail not found' }

  const nextImages = cocktail.images.filter((u) => u !== input.url)
  if (nextImages.length === cocktail.images.length) {
    return { ok: false, error: 'Image not in gallery.' }
  }

  const { error } = await persistImages(input.cocktailId, workspace.id, nextImages)
  if (error) return { ok: false, error }

  try {
    await deleteByPublicUrl('cocktail-images', input.url)
  } catch {
    /* ignore */
  }

  invalidate(input.cocktailId)
  return { ok: true, images: nextImages }
}
