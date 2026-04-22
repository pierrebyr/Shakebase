import Link from 'next/link'
import { requireUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { Icon } from '@/components/icons'
import { ChangePasswordForm } from './ChangePasswordForm'

function relTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export default async function SecuritySettingsPage() {
  const user = await requireUser()
  const admin = createAdminClient()

  const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 200 })
  const authUser = usersPage.users.find((u) => u.id === user.id)
  const lastSignIn = authUser?.last_sign_in_at ?? null
  const passwordUpdated =
    authUser && 'updated_at' in authUser ? (authUser as { updated_at?: string }).updated_at : null

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">Account</div>
        <h1 className="page-title">Security.</h1>
        <p className="page-sub">
          Protect your account with a strong password and keep an eye on new sign-ins.
        </p>
      </div>

      <div className="col" style={{ gap: 20 }}>
        <div
          className="card card-pad"
          style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
        >
          <Meta label="Email" value={user.email ?? '—'} />
          <Meta label="Last sign-in" value={relTime(lastSignIn)} />
          <Meta label="Password last changed" value={relTime(passwordUpdated)} />
          <Meta label="Two-factor auth" value="Off · coming soon" />
        </div>

        <ChangePasswordForm />

        <div
          className="card card-pad"
          style={{
            padding: 22,
            background: 'var(--bg-sunken)',
            border: '1px dashed var(--line-1)',
            boxShadow: 'none',
          }}
        >
          <div className="panel-title" style={{ marginBottom: 8 }}>
            Coming soon
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
            2FA (TOTP authenticator) and single-use recovery codes will arrive alongside SSO. For
            now, set a strong password and enable email sign-in alerts via Notifications.
          </p>
        </div>
      </div>
    </>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="col" style={{ gap: 4 }}>
      <span
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-4)',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13.5 }}>{value}</span>
    </div>
  )
}
