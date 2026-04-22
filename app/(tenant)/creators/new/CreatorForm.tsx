'use client'

import { useActionState } from 'react'
import { addCreatorAction, type AddCreatorResult } from './actions'

const initialState: AddCreatorResult = { ok: true }

export function CreatorForm() {
  const [state, action, pending] = useActionState(addCreatorAction, initialState)
  return (
    <form action={action} className="card card-pad" style={{ padding: 28, maxWidth: 640 }}>
      <div className="col" style={{ gap: 16 }}>
        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Full name</span>
          <input name="name" required className="sb-input" placeholder="Mirela Sato" />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Role / title</span>
            <input name="role" className="sb-input" placeholder="Head Mixologist" />
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Joined</span>
            <input name="joined_year" className="sb-input" placeholder="2021" />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Venue</span>
            <input name="venue" className="sb-input" placeholder="Aurelia Bar" />
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>City</span>
            <input name="city" className="sb-input" placeholder="Lisbon" />
          </label>
        </div>

        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Bio</span>
          <textarea
            name="bio"
            rows={3}
            className="sb-input"
            style={{ resize: 'vertical' }}
            placeholder="Head bartender, Aurelia. Focus on agave and acid-adjusted classics."
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
        <button
          type="submit"
          className="btn-primary"
          disabled={pending}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        >
          {pending ? 'Adding…' : 'Add creator'}
        </button>
      </div>
    </form>
  )
}
