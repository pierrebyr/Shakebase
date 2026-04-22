'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'

const NotifSchema = z.object({
  submissions: z.string().optional(),
  mentions: z.string().optional(),
  digest: z.string().optional(),
  stock_alerts: z.string().optional(),
  channel: z.enum(['email', 'in-app', 'both']),
})

export type NotifResult = { ok: true } | { ok: false; error: string }

export async function updateNotificationsAction(
  _: unknown,
  formData: FormData,
): Promise<NotifResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = NotifSchema.safeParse({
    submissions: formData.get('submissions') ?? '',
    mentions: formData.get('mentions') ?? '',
    digest: formData.get('digest') ?? '',
    stock_alerts: formData.get('stock_alerts') ?? '',
    channel: formData.get('channel'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('user_notification_prefs')
    .upsert({
      user_id: user.id,
      workspace_id: workspace.id,
      submissions: parsed.data.submissions === 'on',
      mentions: parsed.data.mentions === 'on',
      digest: parsed.data.digest === 'on',
      stock_alerts: parsed.data.stock_alerts === 'on',
      channel: parsed.data.channel,
    } as never)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings/notifications')
  return { ok: true }
}
