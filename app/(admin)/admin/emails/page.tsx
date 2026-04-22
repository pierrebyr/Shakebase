import Link from 'next/link'
import { TEMPLATE_PREVIEWS } from '@/lib/email/templates'

export const metadata = { title: 'Email templates · ShakeBase admin' }

export default function EmailsAdminPage() {
  return (
    <div style={{ padding: '24px 32px 64px', maxWidth: 1040 }}>
      <div className="page-head" style={{ marginBottom: 24 }}>
        <div className="page-kicker">Messaging</div>
        <h1 className="page-title">Email templates.</h1>
        <p className="page-sub">
          Every transactional email ShakeBase sends — rendered with sample data. Click through
          to see the inbox-safe HTML and the plain-text fallback.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {TEMPLATE_PREVIEWS.map((t) => {
          const rendered = t.render()
          return (
            <Link
              key={t.id}
              href={`/admin/emails/${t.id}`}
              className="card"
              style={{
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-4)',
                }}
              >
                {t.kind}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{t.label}</div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink-3)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {rendered.subject}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
