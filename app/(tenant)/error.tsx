'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[tenant] unhandled', error)
  }, [error])

  return (
    <div className="page fade-up" style={{ maxWidth: 560 }}>
      <div className="page-head">
        <div className="page-kicker">Workspace error</div>
        <h1 className="page-title">Something blocked this screen.</h1>
        <p className="page-sub">
          Your data is safe. Reload this page or head back to the dashboard — if it persists, ping
          support with the reference below.
        </p>
      </div>
      {error.digest && (
        <div
          className="card card-pad"
          style={{
            padding: 14,
            marginBottom: 16,
            background: 'var(--bg-sunken)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink-3)',
          }}
        >
          ref · {error.digest}
        </div>
      )}
      <div className="row gap-sm">
        <button type="button" className="btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
