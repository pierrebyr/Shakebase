'use client'

// Fallback when even the root layout throws. Must render its own <html> + <body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '48px 24px',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, system-ui, sans-serif",
          background: '#faf7f1',
          color: '#1a1918',
        }}
      >
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#c23a32',
              marginBottom: 14,
            }}
          >
            Error · critical
          </div>
          <h1
            style={{
              fontSize: 40,
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            The app crashed before it could load.
          </h1>
          <p style={{ margin: '20px auto', color: '#555', maxWidth: '42ch', lineHeight: 1.5 }}>
            A rare one. Reloading usually fixes it — if not, email us at{' '}
            <a href="mailto:support@shakebase.co" style={{ color: '#8a5a28' }}>
              support@shakebase.co
            </a>
            .
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: '#888', fontFamily: 'ui-monospace, monospace' }}>
              ref · {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 18,
              padding: '10px 18px',
              borderRadius: 999,
              background: '#1a1918',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              border: 0,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
