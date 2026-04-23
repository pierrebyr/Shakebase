'use client'

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { signupAction, type SignupResult } from './actions'
import { SLUG_REGEX } from '@/lib/constants'

type SlugCheck =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'ok' }
  | { state: 'taken' | 'invalid'; reason: string }

type Plan = 'creator' | 'starter' | 'studio'

const PLANS: Array<{
  id: Plan
  label: string
  price: string
  trailing: string
  hint: string
}> = [
  { id: 'creator', label: 'Creator', price: 'Free', trailing: 'forever', hint: 'For bartenders & consultants' },
  { id: 'starter', label: 'Starter', price: '$99', trailing: '/ mo · 14-day trial', hint: 'Small brand · 1 venue' },
  { id: 'studio', label: 'Studio', price: '$399', trailing: '/ mo · 14-day trial', hint: 'Brands & bar groups' },
]

const initialState: SignupResult = { ok: true }

function passwordStrength(pwd: string): number {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score += 1
  if (pwd.length >= 12) score += 1
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1
  if (/\d/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score += 1
  return Math.min(4, score)
}

const STRENGTH_LABEL = ['Empty', 'Weak', 'Fair', 'Good', 'Strong']

function slugify(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function isPlan(v: string | null): v is Plan {
  return v === 'creator' || v === 'starter' || v === 'studio'
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState)
  const searchParams = useSearchParams()
  const initialPlan = (() => {
    const raw = searchParams?.get('plan')
    return isPlan(raw) ? raw : 'studio'
  })()
  const [plan, setPlan] = useState<Plan>(initialPlan)
  const [slug, setSlug] = useState('')
  const [company, setCompany] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [pwd, setPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [check, setCheck] = useState<SlugCheck>({ state: 'idle' })
  const [terms, setTerms] = useState(false)
  const [, startTransition] = useTransition()

  const isCreator = plan === 'creator'

  // Auto-suggest slug from company unless user edited it
  useEffect(() => {
    if (slugEdited) return
    setSlug(slugify(company))
  }, [company, slugEdited])

  // Validate slug
  useEffect(() => {
    if (!slug) return setCheck({ state: 'idle' })
    if (slug.length < 3)
      return setCheck({ state: 'invalid', reason: 'Too short' })
    if (!SLUG_REGEX.test(slug))
      return setCheck({
        state: 'invalid',
        reason: 'Lowercase letters, numbers, hyphens only',
      })

    const t = setTimeout(() => {
      setCheck({ state: 'checking' })
      startTransition(async () => {
        try {
          const res = await fetch(`/api/workspaces/slug-check?slug=${encodeURIComponent(slug)}`)
          const json = (await res.json()) as { valid: boolean; reason?: string }
          if (json.valid) return setCheck({ state: 'ok' })
          const msg: Record<string, string> = {
            taken: 'Taken — try another',
            reserved: 'Reserved — try another',
            format: 'Invalid format',
            empty: 'Required',
          }
          setCheck({
            state: json.reason === 'taken' ? 'taken' : 'invalid',
            reason: msg[json.reason ?? ''] ?? 'Not available',
          })
        } catch {
          setCheck({ state: 'idle' })
        }
      })
    }, 400)
    return () => clearTimeout(t)
  }, [slug])

  const strength = useMemo(() => passwordStrength(pwd), [pwd])

  const slugStatusText = (() => {
    switch (check.state) {
      case 'checking':
        return 'Checking…'
      case 'ok':
        return isCreator
          ? 'Available — this is your personal handle'
          : 'Available — your team will sign in here'
      case 'taken':
      case 'invalid':
        return check.reason
      default:
        return isCreator ? 'Pick your handle' : 'Pick a workspace subdomain'
    }
  })()

  return (
    <form action={action}>
      <input type="hidden" name="plan" value={plan} />

      <div className="plan-picker" role="radiogroup" aria-label="Choose a plan">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={plan === p.id}
            className="plan-picker-item"
            data-active={plan === p.id}
            onClick={() => setPlan(p.id)}
          >
            <div className="pp-label">{p.label}</div>
            <div className="pp-price">
              <span>{p.price}</span>
              <small>{p.trailing}</small>
            </div>
            <div className="pp-hint">{p.hint}</div>
          </button>
        ))}
      </div>

      <div className="auth-field">
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          className="auth-input"
          placeholder={isCreator ? 'Eli Marchant' : 'Eli Marchant'}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="workspaceName">{isCreator ? 'Display name' : 'Company'}</label>
        <input
          id="workspaceName"
          name="workspaceName"
          required
          className="auth-input"
          placeholder={isCreator ? 'Eli Marchant' : 'Aurelia Spirits'}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="email">{isCreator ? 'Email' : 'Work email'}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="auth-input"
          placeholder={isCreator ? 'you@email.com' : 'eli@aurelia-spirits.com'}
        />
        <div className="auth-field-hint">We&rsquo;ll send a magic link to confirm.</div>
      </div>

      <div className="auth-field">
        <label htmlFor="slug">
          {isCreator ? 'Your handle' : 'Workspace subdomain'}
        </label>
        <div className="sub-wrap">
          <input
            id="slug"
            name="slug"
            required
            placeholder={isCreator ? 'eli-marchant' : 'aurelia'}
            value={slug}
            onChange={(e) => {
              setSlugEdited(true)
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }}
            aria-invalid={check.state === 'invalid' || check.state === 'taken'}
          />
          <span className="suffix">.shakebase.co</span>
        </div>
        <div
          className="sub-status"
          data-state={
            check.state === 'ok'
              ? 'ok'
              : check.state === 'taken'
                ? 'taken'
                : check.state === 'invalid'
                  ? 'invalid'
                  : check.state === 'checking'
                    ? 'checking'
                    : 'idle'
          }
        >
          <i />
          {slugStatusText}
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <div className="auth-pwd">
          <input
            id="password"
            name="password"
            type={showPwd ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            className="auth-input"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <button
            type="button"
            className="toggle"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? (
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
        <div className="pwd-strength" data-lvl={strength}>
          <div className="bars">
            <i /><i /><i /><i />
          </div>
          <span className="lbl">{STRENGTH_LABEL[strength]}</span>
        </div>
      </div>

      <label className="terms-row">
        <input
          type="checkbox"
          name="terms"
          required
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
        />
        <span className="check-box" />
        <span>
          I agree to the <a href="/terms">Terms</a>, <a href="/privacy">Privacy Policy</a>, and
          the <a href="/dpa">DPA</a>. You can opt out of product updates at any time.
        </span>
      </label>

      {!state.ok && <div className="auth-error">{state.error}</div>}

      <button
        type="submit"
        className="auth-submit"
        disabled={
          pending ||
          check.state === 'invalid' ||
          check.state === 'taken' ||
          check.state === 'checking' ||
          !terms
        }
      >
        {pending
          ? 'Spinning up your workspace…'
          : isCreator
            ? 'Create free workspace'
            : 'Create your workspace'}
        <span className="arrow">→</span>
      </button>

      <p className="auth-legal">
        {isCreator
          ? 'Free forever · No credit card · Upgrade anytime'
          : '14-day trial · No credit card · Cancel anytime'}
      </p>
    </form>
  )
}
