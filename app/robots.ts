import type { MetadataRoute } from 'next'

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'shakebase.co'
const SITE_URL = `https://${ROOT}`

// Only the apex marketing site should be indexed. Tenant subdomains host
// private workspace data; super-admin and API routes are off-limits.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard',
          '/dashboard/',
          '/settings',
          '/settings/',
          '/cocktails',
          '/cocktails/',
          '/creators',
          '/creators/',
          '/products',
          '/products/',
          '/ingredients',
          '/ingredients/',
          '/collections',
          '/collections/',
          '/analytics',
          '/accept-invite',
          '/signup/success',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
