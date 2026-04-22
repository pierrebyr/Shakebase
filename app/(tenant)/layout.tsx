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

// Race a thenable against an explicit deadline — Supabase calls can hang
// silently on cold starts and push the layout past Vercel's 10s serverless
// limit. Always resolves/rejects, never leaves the function hanging.
async function withTimeout<T>(p: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[tenant-layout] ${label} timed out after ${ms}ms`)), ms),
    ),
  ])
}

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getCurrentWorkspace()
  const user = await getUser()
  if (!user) redirect(marketingUrl('/login'))

  // Fan out every admin query in parallel — they're independent reads. Going
  // sequential added up to 5 round-trips before the page even started; on a
  // cold start the whole layout could exceed Vercel's 10s timeout.
  const admin = createAdminClient()
  const supabase = await createClient()

  const [saRes, membershipRes, profileRes, settingsRes, pinnedRes] = await Promise.allSettled([
    withTimeout(
      admin.from('super_admins').select('user_id').eq('user_id', user.id).maybeSingle(),
      3000,
      'super_admin',
    ),
    withTimeout(
      admin
        .from('memberships')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('user_id', user.id)
        .not('joined_at', 'is', null)
        .maybeSingle(),
      3000,
      'membership',
    ),
    withTimeout(
      supabase.from('profiles').select('full_name, job_title').eq('id', user.id).maybeSingle(),
      3000,
      'profile',
    ),
    withTimeout(
      admin
        .from('workspace_settings')
        .select('density, typography, accent, reduce_motion')
        .eq('workspace_id', workspace.id)
        .maybeSingle(),
      3000,
      'workspace_settings',
    ),
    withTimeout(
      admin
        .from('cocktails')
        .select('id, slug, name, orb_from, orb_to')
        .eq('workspace_id', workspace.id)
        .eq('pinned', true)
        .neq('status', 'archived')
        .order('name')
        .limit(8),
      3000,
      'pinned',
    ),
  ])

  // Membership gate — super-admin bypasses. Only redirect if we successfully
  // determined there's no access; a timed-out check is logged and treated as
  // "probably allowed" so a flaky Supabase call doesn't kick real members out.
  const sa =
    saRes.status === 'fulfilled'
      ? (saRes.value as { data: { user_id: string } | null }).data
      : (console.error('[tenant-layout]', saRes.reason), null)
  if (!sa) {
    if (membershipRes.status === 'fulfilled') {
      const membership = (membershipRes.value as { data: { id: string } | null }).data
      if (!membership) redirect(marketingUrl('/login'))
    } else {
      console.error('[tenant-layout]', membershipRes.reason)
    }
  }

  // Profile → fullName
  type Profile = { full_name: string | null; job_title: string | null }
  let profile: Profile | null = null
  if (profileRes.status === 'fulfilled') {
    profile = (profileRes.value as { data: Profile | null }).data
  } else {
    console.error('[tenant-layout]', profileRes.reason)
  }
  const fullName = profile?.full_name ?? user.email ?? 'Guest'
  const jobTitle = profile?.job_title ?? null

  const frozen = isWorkspaceFrozen(workspace)

  // Appearance settings → theme tokens
  type Settings = {
    density: string | null
    typography: string | null
    accent: string | null
    reduce_motion: boolean | null
  }
  let s: Settings | null = null
  if (settingsRes.status === 'fulfilled') {
    s = (settingsRes.value as { data: Settings | null }).data
  } else {
    console.error('[tenant-layout]', settingsRes.reason)
  }

  const accentPreset = resolveAccentPreset(s?.accent)

  // Pinned cocktails for sidebar
  let pinned: PinnedCocktail[] = []
  if (pinnedRes.status === 'fulfilled') {
    const data = (pinnedRes.value as { data: PinnedCocktail[] | null }).data
    pinned = (data ?? []) as PinnedCocktail[]
  } else {
    console.error('[tenant-layout]', pinnedRes.reason)
  }

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
