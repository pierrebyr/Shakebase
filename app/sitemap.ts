import type { MetadataRoute } from 'next'

// ── PUBLIC-MARKETING LOCKDOWN ─────────────────────────────────────────
// Public sitemap intentionally empty while the marketing surface is
// gated. Leaving the route in place (empty array) means /sitemap.xml
// returns a valid, empty sitemap rather than a 404 — avoids confusing
// any tool that probes for it.
//
// To re-open: restore the previous list of marketing URLs from git
// history before 2026-04-23.
// ──────────────────────────────────────────────────────────────────────
export default function sitemap(): MetadataRoute.Sitemap {
  return []
}
