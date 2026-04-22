'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // TODO: send to Sentry / Datadog when wired up.
    console.error('[marketing] unhandled', error)
  }, [error])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '64px 24px',
        background: 'var(--bg)',
      }}
    >
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <div className="page-kicker" style={{ justifyContent: 'center' }}>
          Something broke
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, margin: '12px 0 16px' }}>
          This page tripped over itself.
        </h1>
        <p style={{ color: 'var(--ink-3)', marginBottom: 24 }}>
          We&rsquo;ve logged the error and we&rsquo;ll look at it. In the meantime try reloading —
          or head back to the home page.
        </p>
        {error.digest && (
          <code
            style={{
              display: 'inline-block',
              fontSize: 11,
              color: 'var(--ink-4)',
              marginBottom: 20,
              fontFamily: 'var(--font-mono)',
            }}
          >
            ref · {error.digest}
          </code>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" className="btn-primary" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
