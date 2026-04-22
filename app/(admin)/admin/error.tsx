'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin] unhandled', error)
  }, [error])

  return (
    <div className="op-page op-fade-up" style={{ maxWidth: 560 }}>
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Operator error
          </div>
          <h1 className="op-title">Something went wrong.</h1>
          <p className="op-sub">
            This view failed to render. Retry — if it keeps failing, check server logs with the
            digest below.
          </p>
        </div>
      </div>
      {error.digest && (
        <div
          className="op-card"
          style={{
            padding: 14,
            marginBottom: 16,
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 12,
            color: 'var(--op-ink-3)',
          }}
        >
          ref · {error.digest}
        </div>
      )}
      <div className="row" style={{ gap: 8 }}>
        <button type="button" className="op-btn primary" onClick={reset}>
          Retry
        </button>
        <Link href="/admin" className="op-btn">
          Overview
        </Link>
      </div>
    </div>
  )
}
