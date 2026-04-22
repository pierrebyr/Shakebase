'use client'

import { useActionState } from 'react'
import { updateBasicsAction, type MutationResult } from './actions'
import { CATEGORIES, GLASS_TYPES, SPIRIT_BASES } from '@/lib/cocktail/categories'

const initialState: MutationResult = { ok: true }

type Props = {
  cocktail: {
    id: string
    name: string
    category: string | null
    spirit_base: string | null
    glass_type: string | null
    garnish: string | null
    tasting_notes: string | null
    status: string
    featured: boolean
    pinned: boolean
  }
}

export function BasicsForm({ cocktail }: Props) {
  const [state, action, pending] = useActionState(updateBasicsAction, initialState)

  return (
    <form action={action} className="card card-pad" style={{ padding: 28 }}>
      <input type="hidden" name="id" value={cocktail.id} />
      <div className="panel-title" style={{ marginBottom: 18 }}>
        Basics
      </div>
      <div className="col" style={{ gap: 16 }}>
        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Name</span>
          <input name="name" required defaultValue={cocktail.name} className="sb-input" />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Spirit</span>
            <select name="spirit_base" defaultValue={cocktail.spirit_base ?? ''} className="sb-input">
              <option value="">—</option>
              {SPIRIT_BASES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Category</span>
            <select name="category" defaultValue={cocktail.category ?? ''} className="sb-input">
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Glass</span>
            <select name="glass_type" defaultValue={cocktail.glass_type ?? ''} className="sb-input">
              <option value="">—</option>
              {GLASS_TYPES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Garnish</span>
          <input name="garnish" defaultValue={cocktail.garnish ?? ''} className="sb-input" />
        </label>

        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Tasting notes</span>
          <textarea
            name="tasting_notes"
            rows={4}
            defaultValue={cocktail.tasting_notes ?? ''}
            className="sb-input"
            style={{ resize: 'vertical', minHeight: 80 }}
          />
        </label>

        <label className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Status</span>
          <select name="status" defaultValue={cocktail.status} className="sb-input">
            <option value="draft">Draft</option>
            <option value="review">In review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label
            className="row"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--line-1)',
              background: cocktail.featured ? 'var(--accent-wash)' : '#fff',
              gap: 10,
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              name="featured"
              defaultChecked={cocktail.featured}
              style={{ width: 16, height: 16, accentColor: 'var(--accent-ink)' }}
            />
            <div className="col" style={{ gap: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>
                Featured
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                Spotlight on dashboard
              </span>
            </div>
          </label>
          <label
            className="row"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--line-1)',
              background: cocktail.pinned ? 'var(--accent-wash)' : '#fff',
              gap: 10,
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              name="pinned"
              defaultChecked={cocktail.pinned}
              style={{ width: 16, height: 16, accentColor: 'var(--accent-ink)' }}
            />
            <div className="col" style={{ gap: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>
                Pinned
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                Quick access in sidebar
              </span>
            </div>
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

        <button type="submit" className="btn-primary" disabled={pending} style={{ alignSelf: 'flex-start' }}>
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
