import type { MetadataRoute } from 'next'

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'shakebase.co'
const SITE_URL = `https://${ROOT}`

// ── PUBLIC-MARKETING LOCKDOWN ─────────────────────────────────────────
// While the IP review is active we Disallow everything on the marketing
// apex so search engines don't cache the old marketing pages. Tenant
// subdomains and admin.shakebase.co have their own robots handling via
// per-route `robots` metadata (tenant layout already sets
// `index: false, follow: false`). No sitemap reference — the sitemap is
// emptied in app/sitemap.ts.
//
// To re-open: revert this file to the previous Allow-/-with-granular-
// Disallows rules (see git history before 2026-04-23).
// ──────────────────────────────────────────────────────────────────────
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
    host: SITE_URL,
  }
}
