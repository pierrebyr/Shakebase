import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { requireUser } from '@/lib/auth/session'
import { Icon } from '@/components/icons'
import { NotificationsForm } from './NotificationsForm'

export default async function NotificationsSettingsPage() {
  const user = await requireUser()
  const workspace = await getCurrentWorkspace()
  if (workspace.owner_user_id !== user.id) redirect('/settings')
  const admin = createAdminClient()

  const { data } = await admin
    .from('user_notification_prefs')
    .select('submissions, mentions, digest, stock_alerts, channel')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const p = data as {
    submissions: boolean | null
    mentions: boolean | null
    digest: boolean | null
    stock_alerts: boolean | null
    channel: string | null
  } | null

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">Workspace</div>
        <h1 className="page-title">Notifications.</h1>
        <p className="page-sub">
          Choose what to hear about from {workspace.name} and where. These settings are personal —
          each teammate has their own preferences.
        </p>
      </div>

      <NotificationsForm
        initial={{
          submissions: p?.submissions ?? true,
          mentions: p?.mentions ?? true,
          digest: p?.digest ?? true,
          stock_alerts: p?.stock_alerts ?? true,
          channel: ((p?.channel as 'email' | 'in-app' | 'both') ?? 'in-app'),
        }}
      />
    </>
  )
}
