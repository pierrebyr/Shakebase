import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { OpShell, type Impersonation } from '@/components/admin/Shell'
import './operator.css'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: isAdmin } = await admin
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!isAdmin) redirect('/login')

  const [
    { count: wsCount },
    { data: profile },
    { count: pastDueCount },
    { data: trialWs },
    { count: pendingCatalogCount },
  ] = await Promise.all([
    admin
      .from('workspaces')
      .select('id', { count: 'exact', head: true })
      .neq('subscription_status', 'canceled'),
    admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    admin
      .from('workspaces')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'past_due'),
    admin
      .from('workspaces')
      .select('id, trial_ends_at')
      .eq('subscription_status', 'trialing'),
    admin
      .from('catalog_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const trials = ((trialWs ?? []) as { id: string; trial_ends_at: string | null }[]).filter(
    (w) => {
      if (!w.trial_ends_at) return false
      const days = Math.ceil((new Date(w.trial_ends_at).getTime() - Date.now()) / 86400000)
      return days <= 14
    },
  )
  const billingTasks = (pastDueCount ?? 0) + trials.length

  const fullName =
    ((profile as { full_name: string | null } | null)?.full_name ?? user.email ?? 'Admin') ?? 'Admin'
  const initials = fullName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const impersonation: Impersonation = null

  return (
    <OpShell
      adminName={fullName.split(' ').slice(0, 2).join(' ')}
      adminInitials={initials || 'SA'}
      counts={{
        workspaces: wsCount ?? 0,
        catalogPending: pendingCatalogCount ?? 0,
        billingTasks,
      }}
      impersonation={impersonation}
    >
      {children}
    </OpShell>
  )
}
