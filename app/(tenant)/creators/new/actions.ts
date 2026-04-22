'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { logTenantAction } from '@/lib/admin/tenant-audit'

const CreatorSchema = z.object({
  name: z.string().min(2, 'Name required'),
  role: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  joined_year: z.string().optional(),
  bio: z.string().optional(),
})

export type AddCreatorResult = { ok: true } | { ok: false; error: string }

export async function addCreatorAction(
  _: unknown,
  formData: FormData,
): Promise<AddCreatorResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = CreatorSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    role: String(formData.get('role') ?? '').trim(),
    venue: String(formData.get('venue') ?? '').trim(),
    city: String(formData.get('city') ?? '').trim(),
    joined_year: String(formData.get('joined_year') ?? '').trim(),
    bio: String(formData.get('bio') ?? '').trim(),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }

  const supabase = await createClient()
  const { data: created, error } = await supabase
    .from('creators')
    .insert({
      workspace_id: workspace.id,
      name: parsed.data.name,
      role: parsed.data.role || null,
      venue: parsed.data.venue || null,
      city: parsed.data.city || null,
      joined_year: parsed.data.joined_year || null,
      bio: parsed.data.bio || null,
    } as never)
    .select('id')
    .single<{ id: string }>()

  if (error || !created) return { ok: false, error: error?.message ?? 'Could not create creator' }

  await logTenantAction({
    userId: user.id,
    userEmail: user.email ?? null,
    workspaceId: workspace.id,
    action: 'creator.create',
    targetKind: 'creator',
    targetId: created.id,
    targetLabel: parsed.data.name,
    meta: { role: parsed.data.role || null, city: parsed.data.city || null },
  })

  redirect('/creators')
}
