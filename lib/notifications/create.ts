import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'

// Every kind maps to ONE preference toggle in user_notification_prefs.
// When we add new kinds, extend this table and the prefs schema in tandem.
export type NotificationKind =
  | 'invite.accepted'
  | 'member.joined'
  | 'member.role_changed'
  | 'member.removed'
  | 'cocktail.submitted'
  | 'cocktail.approved'
  | 'cocktail.rejected'
  | 'mention'
  | 'stock.low'

type PrefKey = 'submissions' | 'mentions' | 'digest' | 'stock_alerts'

const KIND_TO_PREF: Record<NotificationKind, PrefKey> = {
  'invite.accepted': 'submissions',
  'member.joined': 'submissions',
  'member.role_changed': 'submissions',
  'member.removed': 'submissions',
  'cocktail.submitted': 'submissions',
  'cocktail.approved': 'submissions',
  'cocktail.rejected': 'submissions',
  mention: 'mentions',
  'stock.low': 'stock_alerts',
}

type Prefs = {
  submissions: boolean | null
  mentions: boolean | null
  digest: boolean | null
  stock_alerts: boolean | null
  channel: string | null
}

export type CreateNotificationInput = {
  recipientUserId: string
  workspaceId: string
  kind: NotificationKind
  title: string
  body?: string | null
  url?: string | null
  actorUserId?: string | null
  actorLabel?: string | null
  meta?: Record<string, unknown>
  email?: {
    subject: string
    text: string
    html?: string
  }
}

export type CreateNotificationResult = {
  delivered: ('in-app' | 'email')[]
  skippedReason?: 'pref_disabled' | 'no_email'
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  const admin = createAdminClient()

  // Resolve channel preference for this recipient + workspace. Defaults
  // (submissions=on, channel='in-app') if no row exists yet — new members
  // get sensible defaults.
  const { data: prefRaw } = await admin
    .from('user_notification_prefs')
    .select('submissions, mentions, digest, stock_alerts, channel')
    .eq('user_id', input.recipientUserId)
    .eq('workspace_id', input.workspaceId)
    .maybeSingle()
  const prefs = (prefRaw as Prefs | null) ?? {
    submissions: true,
    mentions: true,
    digest: true,
    stock_alerts: true,
    channel: 'in-app',
  }

  const prefKey = KIND_TO_PREF[input.kind]
  const allowed = prefs[prefKey] ?? true
  if (!allowed) return { delivered: [], skippedReason: 'pref_disabled' }

  const channel = prefs.channel ?? 'in-app'
  const wantsInApp = channel === 'in-app' || channel === 'both'
  const wantsEmail = channel === 'email' || channel === 'both'
  const delivered: ('in-app' | 'email')[] = []

  if (wantsInApp) {
    await admin.from('notifications').insert({
      recipient_user_id: input.recipientUserId,
      workspace_id: input.workspaceId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      url: input.url ?? null,
      actor_user_id: input.actorUserId ?? null,
      actor_label: input.actorLabel ?? null,
      meta: input.meta ?? {},
    } as never)
    delivered.push('in-app')
  }

  if (wantsEmail && input.email) {
    const { data: userRes } = await admin.auth.admin.getUserById(input.recipientUserId)
    const toEmail = userRes?.user?.email
    if (toEmail) {
      const html =
        input.email.html ??
        `<p>${input.email.text.replace(/\n/g, '<br />')}</p>`
      await sendEmail({
        to: toEmail,
        subject: input.email.subject,
        text: input.email.text,
        html,
      })
      delivered.push('email')
    }
  }

  return { delivered }
}
