import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon } from '@/components/icons'
import { TEMPLATE_PREVIEWS } from '@/lib/email/templates'

type Props = { params: Promise<{ id: string }> }

export default async function EmailPreviewPage({ params }: Props) {
  const { id } = await params
  const template = TEMPLATE_PREVIEWS.find((t) => t.id === id)
  if (!template) notFound()

  const rendered = template.render()

  return (
    <div style={{ padding: '24px 32px 64px', maxWidth: 1200 }}>
      <Link
        href="/admin/emails"
        className="row gap-sm"
        style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 18 }}
      >
        <Icon name="chevron-l" size={13} /> All templates
      </Link>

      <div className="page-head" style={{ marginBottom: 20 }}>
        <div className="page-kicker">{template.kind}</div>
        <h1 className="page-title" style={{ textWrap: 'balance' }}>
          {template.label}.
        </h1>
      </div>

      <div
        className="card card-pad"
        style={{ padding: 20, marginBottom: 20 }}
      >
        <MetaRow label="Subject" value={rendered.subject} mono />
        <MetaRow label="Preheader" value={rendered.preheader} />
        <MetaRow
          label="Template ID"
          value={template.id}
          mono
          noBorder
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
        className="email-preview-grid"
      >
        <div className="card" style={{ overflow: 'hidden' }}>
          <div
            className="panel-title"
            style={{ padding: '12px 16px', borderBottom: '1px solid var(--line-2)' }}
          >
            Preview · rendered HTML
          </div>
          <iframe
            title={`${template.label} preview`}
            srcDoc={rendered.html}
            sandbox=""
            style={{
              width: '100%',
              height: 720,
              border: 'none',
              display: 'block',
              background: '#f3f1ea',
            }}
          />
        </div>

        <div className="col" style={{ gap: 20 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div
              className="panel-title"
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--line-2)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Plain-text fallback</span>
              <span
                className="mono"
                style={{ fontSize: 10, color: 'var(--ink-4)' }}
              >
                for deliverability
              </span>
            </div>
            <pre
              style={{
                margin: 0,
                padding: 16,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--ink-2)',
                maxHeight: 360,
                overflowY: 'auto',
              }}
            >
              {rendered.text}
            </pre>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div
              className="panel-title"
              style={{ padding: '12px 16px', borderBottom: '1px solid var(--line-2)' }}
            >
              HTML source
            </div>
            <pre
              style={{
                margin: 0,
                padding: 16,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--ink-3)',
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {rendered.html}
            </pre>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .email-preview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function MetaRow({
  label,
  value,
  mono,
  noBorder,
}: {
  label: string
  value: string
  mono?: boolean
  noBorder?: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        padding: '10px 0',
        borderBottom: noBorder ? 'none' : '1px solid var(--line-2)',
        gap: 16,
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-4)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: 'var(--ink-1)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  )
}
