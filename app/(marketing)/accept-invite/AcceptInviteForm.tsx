'use client'

import { useActionState } from 'react'
import { Icon } from '@/components/icons'
import { acceptInviteAction, type AcceptResult } from './actions'

const initialState: AcceptResult = { ok: true }

type Props = {
  token: string
  email: string
  workspaceName: string
  role: string
  signedInEmail: string | null
  emailMatch: boolean
}

export function AcceptInviteForm({
  token,
  email,
  workspaceName,
  role,
  signedInEmail,
  emailMatch,
}: Props) {
  const [state, action, pending] = useActionState(acceptInviteAction, initialState)

  if (signedInEmail && !emailMatch) {
    return (
      <div
        className="card card-pad"
        style={{ padding: 28, borderColor: '#f0cccc', background: '#fdf7f7' }}
      >
        <div className="panel-title" style={{ color: 'var(--crit)', marginBottom: 6 }}>
          Email mismatch
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          You&apos;re signed in as <strong>{signedInEmail}</strong>. This invitation was sent to
          <strong> {email}</strong>.
        </p>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
          <a
            href="/api/auth/logout"
            style={{ color: 'var(--accent-ink)', fontWeight: 500 }}
          >
            Sign out
          </a>{' '}
          and open this invite link again to accept as {email}.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="card card-pad" style={{ padding: 28 }}>
      <input type="hidden" name="token" value={token} />
      <div className="col" style={{ gap: 18 }}>
        <div
          className="row"
          style={{
            padding: '12px 14px',
            background: 'var(--bg-sunken)',
            borderRadius: 12,
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f5d9a9, #c49155)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 14,
            }}
          >
            {workspaceName.slice(0, 2).toUpperCase()}
          </div>
          <div className="col" style={{ minWidth: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{workspaceName}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
              {email} · <span style={{ textTransform: 'capitalize' }}>{role}</span>
            </span>
          </div>
        </div>

        {signedInEmail ? (
          <>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: 0 }}>
              You&apos;re signed in as <strong>{signedInEmail}</strong>. Accept to join this
              workspace.
            </p>
          </>
        ) : (
          <>
            <label className="col" style={{ gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Your full name</span>
              <input
                name="fullName"
                required
                autoComplete="name"
                className="sb-input"
                placeholder="Eli Marchant"
              />
            </label>
            <label className="col" style={{ gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Choose a password</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="sb-input"
              />
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
                At least 8 characters. You&apos;ll log in with this afterwards.
              </span>
            </label>
          </>
        )}

        {!state.ok && (
          <div
            role="alert"
            style={{
              fontSize: 12.5,
              color: 'var(--crit)',
              background: '#fdf0f0',
              border: '1px solid #f0cccc',
              padding: '8px 12px',
              borderRadius: 10,
            }}
          >
            {state.error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={pending}
          style={{ justifyContent: 'center' }}
        >
          <Icon name="check" size={13} />
          {pending
            ? 'Joining…'
            : signedInEmail
              ? `Join ${workspaceName}`
              : `Create account & join ${workspaceName}`}
        </button>
      </div>
    </form>
  )
}
