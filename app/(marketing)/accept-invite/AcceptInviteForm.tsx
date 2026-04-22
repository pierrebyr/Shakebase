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
        style={{
          background: '#fdf7f7',
          border: '1px solid #f0cccc',
          borderRadius: 14,
          padding: '18px 20px',
          marginTop: 8,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--crit)',
            marginBottom: 8,
          }}
        >
          Email mismatch
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          You&apos;re signed in as <strong>{signedInEmail}</strong>. This invitation was sent to{' '}
          <strong>{email}</strong>.
        </p>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
          <a href="/api/auth/logout" style={{ color: 'var(--accent-ink)', fontWeight: 500 }}>
            Sign out
          </a>{' '}
          and open this invite link again to accept as {email}.
        </p>
      </div>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />

      {/* Workspace pill — which workspace + role you're about to join */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          background: 'var(--bg-sunken)',
          border: '1px solid var(--line-2)',
          borderRadius: 12,
          marginBottom: 22,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f5d9a9, #c49155)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          {workspaceName.slice(0, 2).toUpperCase()}
        </div>
        <div className="col" style={{ minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink-1)' }}>
            {workspaceName}
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
            {email} · <span style={{ textTransform: 'capitalize' }}>{role}</span>
          </span>
        </div>
      </div>

      {signedInEmail ? (
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 18px', lineHeight: 1.55 }}>
          You&apos;re signed in as <strong style={{ color: 'var(--ink-2)' }}>{signedInEmail}</strong>.
          Accept to join this workspace.
        </p>
      ) : (
        <>
          <div className="auth-field">
            <label htmlFor="ai-name">Your full name</label>
            <input
              id="ai-name"
              name="fullName"
              required
              autoComplete="name"
              className="auth-input"
              placeholder="Eli Marchant"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="ai-pwd">Choose a password</label>
            <input
              id="ai-pwd"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="auth-input"
            />
            <span className="auth-field-hint">
              At least 8 characters. You&apos;ll use it to sign in afterwards.
            </span>
          </div>
        </>
      )}

      {!state.ok && (
        <div className="auth-error" role="alert" style={{ marginTop: 4 }}>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        className="auth-submit"
        disabled={pending}
        style={{ marginTop: 16 }}
      >
        <Icon name="check" size={13} />
        {pending
          ? 'Joining…'
          : signedInEmail
            ? `Join ${workspaceName}`
            : `Create account & join ${workspaceName}`}
        <span className="arrow">→</span>
      </button>
    </form>
  )
}
