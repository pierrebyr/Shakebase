import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Sidebar, type PinnedCocktail } from '@/components/shell/Sidebar'
import { Topbar } from '@/components/shell/Topbar'

// Tenant workspaces are private — prevent search engines from indexing
// any subdomain content even if a URL leaks.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
import { getCurrentWorkspace, isWorkspaceFrozen } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { marketingUrl } from '@/lib/cookies'
import { TrialBanner } from '@/components/shell/TrialBanner'
import { ImpersonationBanner } from '@/components/shell/ImpersonationBanner'
import { ThemeApplier } from '@/components/ThemeApplier'

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getCurrentWorkspace()
  const user = await getUser()
  if (!user) redirect(marketingUrl('/login'))

  // Membership check — super-admins bypass.
  const admin = createAdminClient()
  const { data: sa } = await admin
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sa) {
    const { data: membership } = await admin
      .from('memberships')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .not('joined_at', 'is', null)
      .maybeSingle()
    if (!membership) {
      redirect(marketingUrl('/login'))
    }
  }

  // Profile
  const supabase = await createClient()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, job_title')
    .eq('id', user.id)
    .maybeSingle()
  const profile = profileData as { full_name: string | null; job_title: string | null } | null
  const fullName = profile?.full_name ?? user.email ?? 'Guest'
  const jobTitle = profile?.job_title ?? null

  const frozen = isWorkspaceFrozen(workspace)

  // Appearance settings
  const { data: settings } = await admin
    .from('workspace_settings')
    .select('density, typography, accent, reduce_motion')
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const s = settings as {
    density: string | null
    typography: string | null
    accent: string | null
    reduce_motion: boolean | null
  } | null

  const accentPreset = resolveAccentPreset(s?.accent)

  // Pinned cocktails for the sidebar quick-access list.
  const { data: pinnedData } = await admin
    .from('cocktails')
    .select('id, name, orb_from, orb_to')
    .eq('workspace_id', workspace.id)
    .eq('pinned', true)
    .neq('status', 'archived')
    .order('name')
    .limit(8)
  const pinned = (pinnedData ?? []) as unknown as PinnedCocktail[]

  return (
    <div className="app">
      <ThemeApplier
        density={s?.density ?? 'comfortable'}
        typography={s?.typography ?? 'technical'}
        accent={accentPreset}
        reduceMotion={Boolean(s?.reduce_motion)}
      />
      <Sidebar workspaceName={workspace.name} user={{ fullName, jobTitle }} pinned={pinned} />
      <div className="main">
        <Topbar crumbs={['ShakeBase', workspace.name]} />
        <ImpersonationBanner />
        <TrialBanner
          status={workspace.subscription_status}
          trialEndsAt={workspace.trial_ends_at}
          frozen={frozen}
        />
        {children}
      </div>
    </div>
  )
}

function resolveAccentPreset(stored: string | null | undefined): string {
  if (!stored) return 'amber'
  const named = stored.toLowerCase()
  if (['amber', 'agave', 'hibiscus', 'lagoon'].includes(named)) return named
  // Legacy hex → closest preset
  if (stored === '#5a7d62') return 'agave'
  if (stored === '#8c5a7f') return 'hibiscus'
  if (stored === '#2f5e7a') return 'lagoon'
  return 'amber'
}
