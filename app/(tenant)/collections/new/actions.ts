'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'

const PALETTES = [
  ['#ffd9c2', '#c5492a'],
  ['#c8dcf0', '#5a7ba8'],
  ['#e9d8c4', '#9c6b3b'],
  ['#d6e4c8', '#6d8a55'],
  ['#f0d4da', '#b55e73'],
  ['#d7c9e6', '#6f4d8f'],
] as const

const CreateSchema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
  palette: z.coerce.number().int().min(0).max(PALETTES.length - 1).optional(),
})

export type CreateCollectionResult = { ok: true } | { ok: false; error: string }

export async function createCollectionAction(
  _: unknown,
  formData: FormData,
): Promise<CreateCollectionResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = CreateSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    palette: formData.get('palette') ?? 0,
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }

  const [from, to] = PALETTES[parsed.data.palette ?? 0]!

  const supabase = await createClient()
  const { data: inserted, error } = await supabase
    .from('collections')
    .insert({
      workspace_id: workspace.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      cover_from: from,
      cover_to: to,
      created_by: user.id,
    } as never)
    .select('id')
    .single<{ id: string }>()

  if (error || !inserted) return { ok: false, error: error?.message ?? 'Could not create collection' }

  redirect(`/collections/${inserted.id}`)
}
