import Link from 'next/link'
import type { Route } from 'next'
import type { ReactNode } from 'react'

type Props = {
  kicker?: string
  title: string
  description?: string
  ctaLabel?: string
  ctaHref?: Route
  illustration?: ReactNode
}

export function EmptyState({ kicker, title, description, ctaLabel, ctaHref, illustration }: Props) {
  return (
    <div
      className="card card-pad fade-up"
      style={{
        padding: 40,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        gap: 12,
      }}
    >
      {illustration && <div style={{ marginBottom: 6 }}>{illustration}</div>}
      {kicker && <div className="page-kicker">{kicker}</div>}
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 26,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      {description && (
        <p style={{ margin: 0, maxWidth: '50ch', color: 'var(--ink-3)', fontSize: 14 }}>{description}</p>
      )}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="btn-primary" style={{ marginTop: 10 }}>
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
