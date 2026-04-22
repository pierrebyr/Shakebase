'use client'

import { useActionState, useState } from 'react'
import { updateCollectionAction, type CollectionMutationResult } from '../actions'

const PALETTES: [string, string, string][] = [
  ['Ember', '#ffd9c2', '#c5492a'],
  ['Lagoon', '#c8dcf0', '#5a7ba8'],
  ['Amber', '#e9d8c4', '#9c6b3b'],
  ['Agave', '#d6e4c8', '#6d8a55'],
  ['Hibiscus', '#f0d4da', '#b55e73'],
  ['Iris', '#d7c9e6', '#6f4d8f'],
]

const initialState: CollectionMutationResult = { ok: true }

type Props = {
  collection: {
    id: string
    name: string
    description: string | null
    cover_from: string
    cover_to: string
    pinned: boolean
  }
}

export function EditCollectionForm({ collection }: Props) {
  const [state, action, pending] = useActionState(updateCollectionAction, initialState)
  const [from, setFrom] = useState(collection.cover_from)
  const [to, setTo] = useState(collection.cover_to)

  function pickPalette(f: string, t: string) {
    setFrom(f)
    setTo(t)
  }

  return (
    <form action={action} className="card card-pad" style={{ padding: 28 }}>
      <input type="hidden" name="id" value={collection.id} />
      <input type="hidden" name="cover_from" value={from} />
      <input type="hidden" name="cover_to" value={to} />

      <div className="col" style={{ gap: 16 }}>
        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Name</span>
          <input
            name="name"
            required
            defaultValue={collection.name}
            className="sb-input"
            style={{ fontSize: 16 }}
          />
        </label>

        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Description</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={collection.description ?? ''}
            className="sb-input"
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
            {PALETTES.map(([label, f, t]) => {
              const active = from === f && to === t
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => pickPalette(f, t)}
                  title={label}
                  style={{
                    width: 72,
                    height: 48,
                    borderRadius: 10,
                    background: `radial-gradient(120% 100% at 30% 25%, ${f}, ${t} 80%)`,
                    border: active ? '2px solid var(--ink-1)' : '2px solid transparent',
                    boxShadow: '0 0 0 2px #fff inset, 0 2px 6px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                  }}
                />
              )
            })}
          </div>
        </div>

        <label
          className="row"
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--line-1)',
            gap: 10,
            alignItems: 'center',
            cursor: 'pointer',
            maxWidth: 360,
          }}
        >
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={collection.pinned}
            style={{ width: 16, height: 16, accentColor: 'var(--accent-ink)' }}
          />
          <div className="col" style={{ gap: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Pin to top</span>
            <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
              Pinned collections appear first in the list.
            </span>
          </div>
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
          <div style={{ fontSize: 12, color: 'var(--ok)' }}>Saved.</div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={pending}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
