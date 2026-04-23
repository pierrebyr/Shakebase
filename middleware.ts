import { NextResponse, type NextRequest } from 'next/server'
import { refreshSupabaseSession } from '@/lib/supabase/middleware'
import { workspaceUrl } from '@/lib/cookies'

const PROD_ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'shakebase.co'
const DEV_ROOT = process.env.NEXT_PUBLIC_DEV_ROOT_DOMAIN ?? 'lvh.me'

type Layer = 'marketing' | 'tenant' | 'admin'

const MARKETING_PATHS = [
  '/',
  '/signup',
  '/login',
  '/pricing',
  '/contact',
  '/accept-invite',
  '/holding',
  '/terms',
  '/privacy',
  '/security',
  '/dpa',
  '/cookies',
]

// ── PUBLIC-MARKETING LOCKDOWN ─────────────────────────────────────────
// While the IP review is active, every marketing path not in this list
// is rewritten to /holding for non-super-admin visitors. Super-admins
// see the real site. To re-open the site, delete the block that calls
// applyMarketingLockdown in the middleware body and remove this
// constant. See docs/overview.md for the full checklist.
const MARKETING_PUBLIC_ALLOW = [
  '/login',
  '/terms',
  '/privacy',
  '/security',
  '/dpa',
  '/cookies',
  '/accept-invite',
  '/holding',
]
const TENANT_PATHS = [
  '/dashboard',
  '/cocktails',
  '/collections',
  '/creators',
  '/ingredients',
  '/products',
  '/analytics',
  '/settings',
  '/onboarding',
  '/accept-invite',
  '/login',
]
const ADMIN_PATHS = ['/admin', '/login']

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}

function resolveLayer(host: string): { layer: Layer; slug?: string } {
  const cleanHost = host.split(':')[0]!
  const isDev =
    cleanHost.endsWith(DEV_ROOT) || cleanHost === 'localhost' || cleanHost === '127.0.0.1'
  const root = isDev ? DEV_ROOT : PROD_ROOT

  if (
    cleanHost === root ||
    cleanHost === `www.${root}` ||
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1'
  ) {
    return { layer: 'marketing' }
  }

  if (cleanHost.endsWith(`.${root}`)) {
    const sub = cleanHost.slice(0, -`.${root}`.length)
    if (sub === 'admin') return { layer: 'admin' }
    return { layer: 'tenant', slug: sub }
  }

  return { layer: 'marketing' }
}

function pathAllowed(pathname: string, allowed: string[]): boolean {
  return allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { layer, slug } = resolveLayer(host)
  const { pathname } = request.nextUrl

  // Stamp the request headers BEFORE refreshSupabaseSession creates the
  // NextResponse.next({ request }) — that call snapshots the headers it
  // will forward to server components. Mutations made after the response
  // is created silently don't propagate.
  request.headers.set('x-app-layer', layer)
  request.headers.set('x-pathname', pathname)
  if (slug) request.headers.set('x-workspace-slug', slug)

  // 1. Refresh Supabase session — this binds cookie mutations to the
  //    response we'll return. The `response` is mutable; if we redirect later
  //    we must copy its cookies onto the redirect response.
  const { response, user, supabase } = await refreshSupabaseSession(request)

  // Mirror the hints onto the response headers too, so any downstream
  // consumer (e.g. a custom header-reading client) can see them.
  response.headers.set('x-app-layer', layer)
  response.headers.set('x-pathname', pathname)
  if (slug) response.headers.set('x-workspace-slug', slug)

  // ── PUBLIC-MARKETING LOCKDOWN + SIGNED-IN FAST-PATH ──────────────────
  // Runs here (not in the layout) because soft navigations would
  // otherwise hit the cached layout and skip the check.
  //
  // Three cases, in order:
  //   (a) super-admin → pass through, see the real marketing site
  //   (b) signed-in non-admin on `/` or `/login` → redirect straight to
  //       their workspace dashboard (they don't need the public site)
  //   (c) anyone else on a non-allow-listed path → rewrite to /holding
  if (layer === 'marketing' && !pathname.startsWith('/api/')) {
    let isSuperAdmin = false
    if (user) {
      // is_super_admin() is SECURITY DEFINER — any authenticated user
      // can call it and get a boolean for their own auth.uid().
      const { data } = await supabase.rpc('is_super_admin')
      isSuperAdmin = Boolean(data)
    }

    // (b) Signed-in non-admin → straight to their workspace.
    if (user && !isSuperAdmin && (pathname === '/' || pathname === '/login')) {
      const { data: memberships } = await supabase
        .from('memberships')
        .select('workspaces!inner(slug)')
        .eq('user_id', user.id)
        .not('joined_at', 'is', null)
        .limit(1)
      const hit = (memberships ?? [])[0] as
        | { workspaces: { slug: string } | null }
        | undefined
      const wsSlug = hit?.workspaces?.slug
      if (wsSlug) {
        const target = new URL(workspaceUrl(wsSlug, '/dashboard'))
        const r = NextResponse.redirect(target)
        response.cookies.getAll().forEach((c) => r.cookies.set(c.name, c.value, c))
        return r
      }
      // No workspace for this user — fall through to the lockdown gate.
    }

    // (c) Lockdown rewrite for non-allow-listed paths (only for
    //     non-super-admin visitors).
    if (!isSuperAdmin) {
      const isAlwaysPublic = MARKETING_PUBLIC_ALLOW.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      )
      if (!isAlwaysPublic) {
        const url = request.nextUrl.clone()
        url.pathname = '/holding'
        url.search = ''
        const rewrite = NextResponse.rewrite(url)
        response.cookies.getAll().forEach((c) =>
          rewrite.cookies.set(c.name, c.value, c),
        )
        response.headers.forEach((v, k) => rewrite.headers.set(k, v))
        return rewrite
      }
    }
  }

  // API routes are host-aware via their handlers; no access control rewrites.
  if (pathname.startsWith('/api/')) {
    return response
  }

  // 2. Access control per layer — redirects carry over the refreshed cookies.
  const redirect = (to: string) => {
    const r = NextResponse.redirect(new URL(to, request.url))
    response.cookies.getAll().forEach((c) => r.cookies.set(c.name, c.value, c))
    return r
  }

  if (layer === 'marketing' && !pathAllowed(pathname, MARKETING_PATHS)) {
    return redirect('/')
  }
  if (layer === 'tenant' && !pathAllowed(pathname, TENANT_PATHS)) {
    return redirect('/dashboard')
  }
  if (layer === 'admin' && !pathAllowed(pathname, ADMIN_PATHS)) {
    return redirect('/admin')
  }

  return response
}
