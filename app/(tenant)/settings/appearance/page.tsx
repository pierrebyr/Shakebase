import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { requireUser } from '@/lib/auth/session'
import { Icon } from '@/components/icons'
import { AppearanceForm } from './AppearanceForm'

type Accent = 'amber' | 'agave' | 'hibiscus' | 'lagoon'

function resolveAccent(stored: string | null): Accent {
  if (!stored) return 'amber'
  const lower = stored.toLowerCase()
  if (['amber', 'agave', 'hibiscus', 'lagoon'].includes(lower)) return lower as Accent
  if (stored === '#5a7d62') return 'agave'
  if (stored === '#8c5a7f') return 'hibiscus'
  if (stored === '#2f5e7a') return 'lagoon'
  return 'amber'
}

export default async function AppearanceSettingsPage() {
  const user = await requireUser()
  const workspace = await getCurrentWorkspace()
  if (workspace.owner_user_id !== user.id) redirect('/settings')
  const admin = createAdminClient()

  const { data } = await admin
    .from('workspace_settings')
    .select('density, typography, accent, reduce_motion')
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const s = data as {
    density: string | null
    typography: string | null
    accent: string | null
    reduce_motion: boolean | null
  } | null

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">Workspace</div>
        <h1 className="page-title">Appearance.</h1>
        <p className="page-sub">
          Tune how {workspace.name} looks for everyone on the team. Changes apply live as you click
          and persist once you save.
        </p>
      </div>

      <AppearanceForm
        initial={{
          density: (s?.density as 'comfortable' | 'compact') ?? 'comfortable',
          typography:
            (s?.typography as 'default' | 'editorial' | 'technical') ?? 'technical',
          accent: resolveAccent(s?.accent ?? null),
          reduceMotion: Boolean(s?.reduce_motion),
        }}
      />
    </>
  )
}
