// Cookie domain helper — cookies must be scoped to the parent domain so
// auth sessions survive cross-subdomain navigation (signup on apex →
// dashboard on <slug>.<root>).
//
// Returns `undefined` for hosts where the browser would reject a domain
// attribute (localhost, 127.0.0.1). On lvh.me and shakebase.co, returns
// the leading-dot form so cookies are shared with all subdomains.

export function cookieDomain(host: string | null | undefined): string | undefined {
  if (!host) return undefined
  const clean = host.split(':')[0] ?? ''
  if (clean === 'localhost' || clean === '127.0.0.1') return undefined
  if (clean === 'lvh.me' || clean.endsWith('.lvh.me')) return '.lvh.me'
  const prodRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (prodRoot && (clean === prodRoot || clean.endsWith(`.${prodRoot}`))) {
    return `.${prodRoot}`
  }
  return undefined
}

// URL helper — builds an absolute URL for the target surface.
// Use when we need to redirect across subdomains (e.g. signup on apex
// → tenant dashboard on <slug>.<root>). In dev uses lvh.me:3000.
export function workspaceUrl(slug: string, path = '/dashboard'): string {
  const isDev = process.env.NODE_ENV !== 'production'
  const protocol = isDev ? 'http' : 'https'
  const root = isDev
    ? process.env.NEXT_PUBLIC_DEV_ROOT_DOMAIN ?? 'lvh.me'
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'shakebase.co'
  const port = isDev ? ':3000' : ''
  return `${protocol}://${slug}.${root}${port}${path}`
}

export function marketingUrl(path = '/'): string {
  const isDev = process.env.NODE_ENV !== 'production'
  const protocol = isDev ? 'http' : 'https'
  const root = isDev
    ? process.env.NEXT_PUBLIC_DEV_ROOT_DOMAIN ?? 'lvh.me'
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'shakebase.co'
  const port = isDev ? ':3000' : ''
  return `${protocol}://${root}${port}${path}`
}

export function adminUrl(path = '/admin'): string {
  const isDev = process.env.NODE_ENV !== 'production'
  const protocol = isDev ? 'http' : 'https'
  const root = isDev
    ? process.env.NEXT_PUBLIC_DEV_ROOT_DOMAIN ?? 'lvh.me'
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'shakebase.co'
  const port = isDev ? ':3000' : ''
  return `${protocol}://admin.${root}${port}${path}`
}
