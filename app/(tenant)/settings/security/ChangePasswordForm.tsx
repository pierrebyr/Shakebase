'use client'

import { useActionState, useRef, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { changePasswordAction, type PasswordResult } from './actions'

const initialState: PasswordResult = { ok: true }

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok && state !== initialState) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form
      ref={formRef}
      action={action}
      className="card card-pad"
      style={{ padding: 28, maxWidth: 520 }}
    >
      <div className="panel-title" style={{ marginBottom: 18 }}>
        Change password
      </div>

      <div className="col" style={{ gap: 14 }}>
        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Current password</span>
          <input
            name="current"
            type="password"
            autoComplete="current-password"
            required
            className="sb-input"
          />
        </label>
        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>New password</span>
          <input
            name="next"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="sb-input"
          />
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
            At least 8 characters.
          </span>
        </label>
        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Confirm new password</span>
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="sb-input"
          />
        </label>

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
        {state.ok && state !== initialState && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--ok)',
              background: '#e3f0e9',
              borderRadius: 10,
              padding: '8px 12px',
            }}
          >
            Password updated.
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={pending}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        >
          <Icon name="check" size={13} />
          {pending ? 'Saving…' : 'Update password'}
        </button>
      </div>
    </form>
  )
}
