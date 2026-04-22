'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[app error]', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '48px 24px',
        background:
          'radial-gradient(900px 520px at 80% -10%, rgba(196,145,85,0.14), transparent 60%), radial-gradient(700px 400px at 0% 30%, rgba(140,90,127,0.08), transparent 60%), linear-gradient(180deg, #faf7f1 0%, transparent 70%)',
        color: 'var(--ink-1)',
      }}
    >
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--crit)',
            marginBottom: 16,
          }}
        >
          Error · something broke
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 'clamp(42px, 8vw, 80px)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            margin: 0,
            color: 'var(--ink-1)',
          }}
        >
          A bottle{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--accent-ink)' }}>
            slipped the pour.
          </span>
        </h1>
        <p
          style={{
            margin: '24px auto 12px',
            maxWidth: '46ch',
            fontSize: 17,
            color: 'var(--ink-2)',
            lineHeight: 1.55,
          }}
        >
          Something went wrong loading this page. Try again, or head back to safety
          while we look into it.
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-4)',
              margin: '0 auto 24px',
            }}
          >
            ref · {error.digest}
          </p>
        )}
        <div
          style={{
            display: 'inline-flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              background: 'var(--ink-1)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              border: 0,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              background: '#fff',
              color: 'var(--ink-1)',
              border: '1px solid var(--line-1)',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
