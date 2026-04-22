'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { logTenantAction } from '@/lib/admin/tenant-audit'

export type CreatorMutationResult = { ok: true } | { ok: false; error: string }

// Split a comma-separated string into a trimmed array
function csv(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string') return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function safeJson(value: FormDataEntryValue | null, fallback: unknown): unknown {
  if (typeof value !== 'string' || value.trim().length === 0) return fallback
  try {
    return JSON.parse(value)
  } catch {
    throw new Error('Invalid JSON in one of the structured fields')
  }
}

const BasicsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Name required'),
  role: z.string().optional(),
  pronouns: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  joined_year: z.string().optional(),
  avatar_hue: z.string().optional(),
  signature: z.string().optional(),
  philosophy: z.string().optional(),
  bio: z.string().optional(),
})

export async function updateCreatorAction(
  _: unknown,
  formData: FormData,
): Promise<CreatorMutationResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = BasicsSchema.safeParse({
    id: formData.get('id'),
    name: String(formData.get('name') ?? '').trim(),
    role: String(formData.get('role') ?? '').trim(),
    pronouns: String(formData.get('pronouns') ?? '').trim(),
    venue: String(formData.get('venue') ?? '').trim(),
    city: String(formData.get('city') ?? '').trim(),
    country: String(formData.get('country') ?? '').trim(),
    joined_year: String(formData.get('joined_year') ?? '').trim(),
    avatar_hue: String(formData.get('avatar_hue') ?? '').trim(),
    signature: String(formData.get('signature') ?? '').trim(),
    philosophy: String(formData.get('philosophy') ?? '').trim(),
    bio: String(formData.get('bio') ?? '').trim(),
  })
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }

  let awards: unknown, competitions: unknown, certifications: unknown, career: unknown
  let press: unknown, socials: unknown, book: unknown
  try {
    awards = safeJson(formData.get('awards'), [])
    competitions = safeJson(formData.get('competitions'), [])
    certifications = safeJson(formData.get('certifications'), [])
    career = safeJson(formData.get('career'), [])
    press = safeJson(formData.get('press'), [])
    socials = safeJson(formData.get('socials'), {})
    book = safeJson(formData.get('book'), null)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid JSON' }
  }

  const hueRaw = parsed.data.avatar_hue ? Number(parsed.data.avatar_hue) : null
  const avatar_hue =
    hueRaw !== null && Number.isFinite(hueRaw) ? Math.max(0, Math.min(360, hueRaw)) : null

  const supabase = await createClient()
  const { error } = await supabase
    .from('creators')
    .update({
      name: parsed.data.name,
      role: parsed.data.role || null,
      pronouns: parsed.data.pronouns || null,
      venue: parsed.data.venue || null,
      city: parsed.data.city || null,
      country: parsed.data.country || null,
      joined_year: parsed.data.joined_year || null,
      avatar_hue,
      signature: parsed.data.signature || null,
      philosophy: parsed.data.philosophy || null,
      bio: parsed.data.bio || null,
      specialties: csv(formData.get('specialties')),
      languages: csv(formData.get('languages')),
      mentors: csv(formData.get('mentors')),
      awards,
      competitions,
      certifications,
      career,
      press,
      socials,
      book,
    } as never)
    .eq('id', parsed.data.id)
    .eq('workspace_id', workspace.id)

  if (error) return { ok: false, error: error.message }

  await logTenantAction({
    userId: user.id,
    userEmail: user.email ?? null,
    workspaceId: workspace.id,
    action: 'creator.update',
    targetKind: 'creator',
    targetId: parsed.data.id,
    targetLabel: parsed.data.name,
  })

  revalidatePath(`/creators/${parsed.data.id}`)
  revalidatePath('/creators')
  return { ok: true }
}

const DeleteSchema = z.object({ id: z.string().uuid() })

export async function deleteCreatorAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()

  const parsed = DeleteSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()

  // Soft delete: keep the row for 30-day recovery, filter everywhere via
  // `deleted_at IS NULL`. Let a nightly job hard-delete after the window.
  const { data: target } = await supabase
    .from('creators')
    .select('name')
    .eq('id', parsed.data.id)
    .eq('workspace_id', workspace.id)
    .maybeSingle<{ name: string }>()

  const { error } = await supabase
    .from('creators')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', parsed.data.id)
    .eq('workspace_id', workspace.id)
  if (error) throw new Error(error.message)

  await logTenantAction({
    userId: user.id,
    userEmail: user.email ?? null,
    workspaceId: workspace.id,
    action: 'creator.delete',
    targetKind: 'creator',
    targetId: parsed.data.id,
    targetLabel: target?.name ?? null,
  })

  redirect('/creators')
}
