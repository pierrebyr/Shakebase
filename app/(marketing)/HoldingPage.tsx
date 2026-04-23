import Link from 'next/link'

// Minimal holding page shown to non-super-admin visitors while the public
// marketing surface is locked down. Rendered from app/(marketing)/layout.tsx
// for every gated path. Kept self-contained so it works without the
// marketing stylesheet / nav / footer.

export function HoldingPage() {
  return (
    <>
      {/* Extra noindex on the holding page itself. Root robots.txt already
          Disallows /, but belt-and-braces for any crawler that ignores it. */}
      <meta name="robots" content="noindex, nofollow" />
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
          background: '#faf6ee',
          color: '#1a1918',
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontStyle: 'italic',
            fontSize: 48,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginBottom: 18,
            color: '#1a1918',
          }}
        >
          ShakeBase
        </div>
        <p
          style={{
            fontSize: 15,
            color: '#4a4640',
            maxWidth: '42ch',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Private beta. Access by invitation only.
        </p>
        <Link
          href="/login"
          style={{
            marginTop: 28,
            fontSize: 12.5,
            color: '#6f5b3a',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Sign in
        </Link>
      </div>
    </>
  )
}
