'use client'

import { useActionState, useState } from 'react'
import { Icon } from '@/components/icons'
import { updateNotificationsAction, type NotifResult } from './actions'

const initialState: NotifResult = { ok: true }

type Prefs = {
  submissions: boolean
  mentions: boolean
  digest: boolean
  stock_alerts: boolean
  channel: 'email' | 'in-app' | 'both'
}

export function NotificationsForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial)
  const [state, action, pending] = useActionState(updateNotificationsAction, initialState)

  return (
    <form action={action} className="card card-pad" style={{ padding: 28, maxWidth: 720 }}>
      <div className="panel-title" style={{ marginBottom: 18 }}>
        Notifications
      </div>

      <div className="col" style={{ gap: 0 }}>
        <Toggle
          label="New cocktail submissions"
          desc="When someone on the team drafts or publishes a new spec."
          name="submissions"
          value={prefs.submissions}
          onChange={(v) => setPrefs({ ...prefs, submissions: v })}
        />
        <Toggle
          label="Comments &amp; mentions"
          desc="When a teammate @mentions you on a cocktail or leaves a comment."
          name="mentions"
          value={prefs.mentions}
          onChange={(v) => setPrefs({ ...prefs, mentions: v })}
        />
        <Toggle
          label="Weekly digest"
          desc="Friday summary — top pours, new additions, stock alerts."
          name="digest"
          value={prefs.digest}
          onChange={(v) => setPrefs({ ...prefs, digest: v })}
        />
        <Toggle
          label="Stock &amp; par alerts"
          desc="When a bottle drops below par in any connected venue."
          name="stock_alerts"
          value={prefs.stock_alerts}
          onChange={(v) => setPrefs({ ...prefs, stock_alerts: v })}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            padding: '18px 0',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Delivery channel</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              Where to send these notifications.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <input type="hidden" name="channel" value={prefs.channel} />
            <Seg
              value={prefs.channel}
              options={['email', 'in-app', 'both']}
              onChange={(v) => setPrefs({ ...prefs, channel: v as Prefs['channel'] })}
            />
          </div>
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
          <div style={{ fontSize: 12, color: 'var(--ok)', marginBottom: 8 }}>Saved.</div>
        )}

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="submit" className="btn-primary" disabled={pending}>
            <Icon name="check" size={13} />
            {pending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Toggle({
  label,
  desc,
  name,
  value,
  onChange,
}: {
  label: string
  desc: string
  name: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        padding: '18px 0',
        borderBottom: '1px solid var(--line-2)',
        alignItems: 'center',
      }}
    >
      <div>
        <div
          style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}
          dangerouslySetInnerHTML={{ __html: label }}
        />
        <div
          style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, maxWidth: '44ch' }}
        >
          {desc}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <input type="hidden" name={name} value={value ? 'on' : ''} />
        <button
          type="button"
          onClick={() => onChange(!value)}
          style={{
            width: 42,
            height: 24,
            borderRadius: 999,
            background: value ? 'var(--ok)' : 'var(--line-1)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 180ms',
            border: 'none',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: 2,
              width: 20,
              height: 20,
              borderRadius: 999,
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transform: value ? 'translateX(18px)' : 'translateX(0)',
              transition: 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          />
        </button>
      </div>
    </div>
  )
}

function Seg({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--bg-sunken)',
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.04em',
            background: value === o ? '#fff' : 'transparent',
            color: value === o ? 'var(--ink-1)' : 'var(--ink-3)',
            boxShadow: value === o ? 'var(--shadow-1)' : 'none',
            cursor: 'pointer',
          }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
