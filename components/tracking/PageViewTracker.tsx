'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Routes we want to track as `page.view` events. Detail pages
// (/cocktails/[slug], /products/[id], /creators/[id]) are tracked
// server-side in the page itself with richer target metadata — don't
// double-count them here.
const TRACKED_ROUTES: Array<{ pattern: RegExp; route: string }> = [
  { pattern: /^\/dashboard\/?$/, route: '/dashboard' },
  { pattern: /^\/cocktails\/?$/, route: '/cocktails' },
  { pattern: /^\/cocktails\/favorites\/?$/, route: '/cocktails/favorites' },
  { pattern: /^\/creators\/?$/, route: '/creators' },
  { pattern: /^\/products\/?$/, route: '/products' },
  { pattern: /^\/ingredients\/?$/, route: '/ingredients' },
  { pattern: /^\/collections\/?$/, route: '/collections' },
  { pattern: /^\/analytics\/?$/, route: '/analytics' },
  { pattern: /^\/settings\/?$/, route: '/settings' },
  { pattern: /^\/settings\/team\/?$/, route: '/settings/team' },
  { pattern: /^\/settings\/billing\/?$/, route: '/settings/billing' },
  { pattern: /^\/settings\/activity\/?$/, route: '/settings/activity' },
  { pattern: /^\/settings\/notifications\/?$/, route: '/settings/notifications' },
]

function matchRoute(pathname: string): string | null {
  for (const { pattern, route } of TRACKED_ROUTES) {
    if (pattern.test(pathname)) return route
  }
  return null
}

export function PageViewTracker() {
  const pathname = usePathname()
  const lastSentRef = useRef<string | null>(null)

  useEffect(() => {
    const route = matchRoute(pathname)
    if (!route) return
    // Skip re-firing for the same route (e.g. shallow param change).
    if (lastSentRef.current === route) return
    lastSentRef.current = route

    const body = JSON.stringify({
      events: [
        {
          kind: 'page.view',
          target: { type: 'page', label: route },
          metadata: { route, referrer: document.referrer || null },
        },
      ],
    })

    // Prefer sendBeacon so the event survives navigations — falls back
    // to fetch if the browser refuses (too big, or not available).
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' })
        const ok = navigator.sendBeacon('/api/activity', blob)
        if (ok) return
      }
    } catch {
      // ignore — fall through to fetch
    }

    void fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Tracking failures must never surface to the user.
    })
  }, [pathname])

  return null
}
