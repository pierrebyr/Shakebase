'use client'

import { useActionState, useState } from 'react'
import { createCollectionAction, type CreateCollectionResult } from './actions'

const PALETTES: [string, string, string][] = [
  ['Ember', '#ffd9c2', '#c5492a'],
  ['Lagoon', '#c8dcf0', '#5a7ba8'],
  ['Amber', '#e9d8c4', '#9c6b3b'],
  ['Agave', '#d6e4c8', '#6d8a55'],
  ['Hibiscus', '#f0d4da', '#b55e73'],
  ['Iris', '#d7c9e6', '#6f4d8f'],
]

const initialState: CreateCollectionResult = { ok: true }

export function NewCollectionForm() {
  const [state, action, pending] = useActionState(createCollectionAction, initialState)
  const [palette, setPalette] = useState(0)

  return (
    <form action={action} className="card card-pad" style={{ padding: 28, maxWidth: 560 }}>
      <div className="col" style={{ gap: 16 }}>
        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Name</span>
          <input
            name="name"
            required
            className="sb-input"
            placeholder="Fall menu 2026"
            style={{ fontSize: 16 }}
            autoFocus
          />
        </label>

        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Description</span>
          <textarea
            name="description"
            rows={3}
            className="sb-input"
            placeholder="Short note on what belongs in this collection."
            style={{ resize: 'vertical' }}
          />
        </label>

        <div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink-4)',
              marginBottom: 10,
            }}
          >
            Cover
          </div>
          <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
            {PALETTES.map(([label, from, to], i) => (
              <button
                key={label}
                type="button"
                onClick={() => setPalette(i)}
                title={label}
                style={{
                  width: 72,
                  height: 48,
                  borderRadius: 10,
                  background: `radial-gradient(120% 100% at 30% 25%, ${from}, ${to} 80%)`,
                  border:
                    palette === i
                      ? '2px solid var(--ink-1)'
                      : '2px solid transparent',
                  boxShadow: '0 0 0 2px #fff inset, 0 2px 6px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
          <input type="hidden" name="palette" value={palette} />
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

        <button
          type="submit"
          className="btn-primary"
          disabled={pending}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        >
          {pending ? 'Creating…' : 'Create collection'}
        </button>
      </div>
    </form>
  )
}
