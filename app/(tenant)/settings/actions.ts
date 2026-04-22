'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'

export type ProfileResult = { ok: true } | { ok: false; error: string }

const ProfileSchema = z.object({
  full_name: z.string().min(1, 'Name required').max(120),
  job_title: z.string().max(120).optional(),
  language: z.string().max(40).optional(),
  time_zone: z.string().max(80).optional(),
})

export async function updateProfileAction(
  _: unknown,
  formData: FormData,
): Promise<ProfileResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const parsed = ProfileSchema.safeParse({
    full_name: String(formData.get('full_name') ?? '').trim(),
    job_title: String(formData.get('job_title') ?? '').trim(),
    language: String(formData.get('language') ?? '').trim(),
    time_zone: String(formData.get('time_zone') ?? '').trim(),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      job_title: parsed.data.job_title || null,
      language: parsed.data.language || null,
      time_zone: parsed.data.time_zone || null,
    } as never)
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }

  // Flush layout so sidebar/topbar pick up the new name.
  revalidatePath('/', 'layout')
  revalidatePath('/settings')
  return { ok: true }
}
