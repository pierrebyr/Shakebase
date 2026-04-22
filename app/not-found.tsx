import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 · ShakeBase',
  description: "The page you were looking for isn't here.",
}

export default function NotFound() {
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
            color: 'var(--accent-ink)',
            marginBottom: 16,
          }}
        >
          Error · 404
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 'clamp(48px, 10vw, 96px)',
            lineHeight: 0.95,
            letterSpacing: '-0.035em',
            margin: 0,
            color: 'var(--ink-1)',
          }}
        >
          Page{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--accent-ink)' }}>
            not found.
          </span>
        </h1>
        <p
          style={{
            margin: '24px auto 36px',
            maxWidth: '44ch',
            fontSize: 17,
            color: 'var(--ink-2)',
            lineHeight: 1.55,
          }}
        >
          The recipe you&rsquo;re after isn&rsquo;t on the menu — either it moved, it
          never existed, or the link was mistyped.
        </p>
        <div
          style={{
            display: 'inline-flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              background: 'var(--ink-1)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Back to home
          </Link>
          <Link
            href="/contact"
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
            Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}
