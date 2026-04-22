import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { Icon } from '@/components/icons'

export default async function ExportSettingsPage() {
  const user = await requireUser()
  const workspace = await getCurrentWorkspace()
  if (workspace.owner_user_id !== user.id) redirect('/settings')

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">Data</div>
        <h1 className="page-title">Data &amp; export.</h1>
        <p className="page-sub">
          Download a snapshot of {workspace.name}. Backups are generated on demand and streamed from
          your workspace — nothing is sent via email.
        </p>
      </div>

      <div className="col" style={{ gap: 20 }}>
        <div className="card card-pad" style={{ padding: 28 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>
            Full workspace export
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 16px', lineHeight: 1.55 }}>
            All cocktails with ingredients, method steps, metadata, and creator links, plus the
            full creator roster, your product catalog, and custom ingredients.
          </p>
          <div className="row gap-sm">
            <a
              href="/api/export/workspace.json"
              download={`${workspace.slug}-export.json`}
              className="btn-primary"
            >
              <Icon name="download" size={13} />
              Download JSON
            </a>
            <a
              href="/api/export/cocktails.csv"
              download={`${workspace.slug}-cocktails.csv`}
              className="btn-secondary"
            >
              <Icon name="download" size={13} />
              Cocktails (CSV)
            </a>
            <a
              href="/api/export/creators.csv"
              download={`${workspace.slug}-creators.csv`}
              className="btn-secondary"
            >
              <Icon name="download" size={13} />
              Creators (CSV)
            </a>
          </div>
        </div>

        <div className="card card-pad" style={{ padding: 22 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="col">
              <div className="panel-title" style={{ marginBottom: 4 }}>
                Backups
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: 0 }}>
                Nightly Supabase snapshots retained 90 days in encrypted cold storage.
              </p>
            </div>
            <span
              className="pill"
              style={{
                background: '#e3f0e9',
                color: 'var(--ok)',
                borderColor: 'transparent',
              }}
            >
              Enabled
            </span>
          </div>
        </div>

        <div
          className="card card-pad"
          style={{ padding: 22, background: 'var(--bg-sunken)', boxShadow: 'none' }}
        >
          <div className="panel-title" style={{ marginBottom: 8 }}>
            Audit log
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, lineHeight: 1.55 }}>
            Every edit and sign-in is captured in the workspace audit log. See recent activity in{' '}
            <Link
              href="/settings/team"
              style={{ color: 'var(--accent-ink)', fontWeight: 500 }}
            >
              Team &amp; roles →
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
