'use client'

import { useActionState } from 'react'
import { updateProfileAction, type ProfileResult } from './actions'

const initialState: ProfileResult = { ok: true }

const LANGUAGES = [
  'English',
  'Français',
  'Español',
  'Italiano',
  'Deutsch',
  'Português',
  'Nederlands',
  '日本語',
  '한국어',
  '中文',
]

// Same list as the timezone picker elsewhere in the app — a curated subset
// rather than the full IANA database, which has ~600 entries.
const TIME_ZONES = [
  'Europe/Paris',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Lisbon',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'UTC',
]

// Backfill legacy short codes ("en", "fr") to their full names so the select
// displays a useful default.
function normalizeLanguage(value: string | null): string {
  if (!value) return ''
  const lower = value.toLowerCase()
  const map: Record<string, string> = {
    en: 'English',
    fr: 'Français',
    es: 'Español',
    it: 'Italiano',
    de: 'Deutsch',
    pt: 'Português',
    nl: 'Nederlands',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
  }
  return map[lower] ?? value
}

type Props = {
  initial: {
    full_name: string | null
    job_title: string | null
    language: string | null
    time_zone: string | null
  }
  email: string | null
}

export function ProfileForm({ initial, email }: Props) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState)
  const language = normalizeLanguage(initial.language)
  const timeZone = initial.time_zone ?? 'Europe/Paris'

  return (
    <form action={action} className="col" style={{ gap: 16 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            background: 'linear-gradient(135deg, #f5d9a9, #c49155)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontStyle: 'italic',
            flexShrink: 0,
          }}
        >
          {(initial.full_name ?? email ?? '??').slice(0, 2).toUpperCase()}
        </div>
        <div className="col" style={{ gap: 4, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            {initial.full_name ?? 'Unnamed'}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{email ?? '—'}</div>
        </div>
      </div>

      <label className="col" style={{ gap: 6 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Full name</span>
        <input
          name="full_name"
          required
          defaultValue={initial.full_name ?? ''}
          className="sb-input"
          placeholder="Aurelia Martin"
        />
      </label>

      <label className="col" style={{ gap: 6 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Job title</span>
        <input
          name="job_title"
          defaultValue={initial.job_title ?? ''}
          className="sb-input"
          placeholder="Head bartender"
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Language</span>
          <select name="language" defaultValue={language} className="sb-input">
            <option value="">—</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Time zone</span>
          <select name="time_zone" defaultValue={timeZone} className="sb-input">
            {TIME_ZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
      </div>

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
        <div style={{ fontSize: 12, color: 'var(--ok)' }}>Saved.</div>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={pending}
        style={{ alignSelf: 'flex-start' }}
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
