'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { loginAction, type LoginResult } from './actions'

const initialState: LoginResult = { ok: true }

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState)
  const [show, setShow] = useState(false)

  return (
    <form action={action}>
      <div className="auth-field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="auth-input"
          placeholder="you@brand.com"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <div className="auth-pwd">
          <input
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            required
            autoComplete="current-password"
            className="auth-input"
          />
          <button
            type="button"
            className="toggle"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 12s3.5-7 10-7c2.4 0 4.4.9 6 2.1M22 12s-3.5 7-10 7c-2.4 0-4.4-.9-6-2.1" />
                <path d="M4 4l16 16" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="auth-row">
        <label className="check-label">
          <input type="checkbox" name="remember" defaultChecked />
          <span className="check-box" />
          Keep me signed in
        </label>
        <Link href="/login">Forgot password?</Link>
      </div>

      {!state.ok && <div className="auth-error">{state.error}</div>}

      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in to ShakeBase'}
        <span className="arrow">→</span>
      </button>

      <p className="auth-legal">
        By signing in you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
      </p>
    </form>
  )
}
