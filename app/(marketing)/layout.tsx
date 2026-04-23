import { headers } from 'next/headers'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { HoldingPage } from './HoldingPage'
import './marketing.css'

// ── PUBLIC-MARKETING LOCKDOWN ─────────────────────────────────────────
// While the IP review is in progress, every public marketing path is
// gated behind a super-admin check. Non-super-admin visitors get the
// HoldingPage; super-admins see the real pages exactly as before.
//
// Kept deliberately minimal so the gate can be removed in a single diff:
// delete the path check + super-admin check + HoldingPage branch and
// return `<>{ScrollProgress}{children}</>` unconditionally. See
// `docs/overview.md` for the re-open checklist.
// ──────────────────────────────────────────────────────────────────────

// Paths that stay public even during the lockdown. `/login` so existing
// users can still sign in; the legal pages because we're legally required
// to expose them; `/accept-invite` so outstanding workspace invites keep
// working.
const ALWAYS_ALLOW_PATHS = [
  '/login',
  '/terms',
  '/privacy',
  '/security',
  '/dpa',
  '/cookies',
  '/accept-invite',
]

function isAlwaysAllowed(pathname: string): boolean {
  return ALWAYS_ALLOW_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

async function visitorIsSuperAdmin(): Promise<boolean> {
  const user = await getUser()
  if (!user) return false
  const admin = createAdminClient()
  const { data } = await admin
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return Boolean(data)
}

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? '/'

  // Always-allowed paths bypass the gate entirely.
  if (isAlwaysAllowed(pathname)) {
    return (
      <>
        <ScrollProgress />
        {children}
      </>
    )
  }

  // Gated path — only super-admins see the real content.
  if (await visitorIsSuperAdmin()) {
    return (
      <>
        <ScrollProgress />
        {children}
      </>
    )
  }

  return <HoldingPage />
}
