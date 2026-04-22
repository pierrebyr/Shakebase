import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { requireUser } from '@/lib/auth/session'
import { PricingToggle } from './GeneralForm'

export const dynamic = 'force-dynamic'

export default async function GeneralSettingsPage() {
  const user = await requireUser()
  const workspace = await getCurrentWorkspace()
  if (workspace.owner_user_id !== user.id) redirect('/settings')
  const supabase = await createClient()

  const { data } = await supabase
    .from('workspace_settings')
    .select('pricing_enabled')
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const pricingEnabled =
    (data as { pricing_enabled: boolean | null } | null)?.pricing_enabled !== false

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">Workspace</div>
        <h1 className="page-title">General.</h1>
        <p className="page-sub">
          Workspace-level preferences for how {workspace.name} uses ShakeBase.
        </p>
      </div>

      <div className="card card-pad" style={{ padding: 28 }}>
        <div className="panel-title" style={{ marginBottom: 6 }}>
          Features
        </div>
        <PricingToggle initial={pricingEnabled} />
      </div>
    </>
  )
}
