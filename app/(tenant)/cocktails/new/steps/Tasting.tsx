'use client'

import type { Draft } from '../types'
import { Field, inputStyle } from './Identity'

const FLAVOR_TAGS: { label: string; color: string }[] = [
  { label: 'Citrus', color: '#f2b93b' },
  { label: 'Saline', color: '#a4afb9' },
  { label: 'Bitter', color: '#7a4f2a' },
  { label: 'Sweet', color: '#e89bc7' },
  { label: 'Smoky', color: '#3a3a3a' },
  { label: 'Floral', color: '#e086a0' },
  { label: 'Herbal', color: '#7aa168' },
  { label: 'Spiced', color: '#d06a2a' },
  { label: 'Tropical', color: '#f58a6e' },
  { label: 'Tart', color: '#c2c14b' },
  { label: 'Rich', color: '#8a5f2e' },
  { label: 'Earthy', color: '#5c4a34' },
]

export function StepTasting({
  draft,
  update,
}: {
  draft: Draft
  update: (patch: Partial<Draft>) => void
}) {
  function toggle(f: string) {
    const has = draft.flavor.includes(f)
    update({
      flavor: has ? draft.flavor.filter((x) => x !== f) : [...draft.flavor, f],
    })
  }

  return (
    <>
      <Field label="Tasting notes">
        <textarea
          value={draft.tasting_notes}
          onChange={(e) => update({ tasting_notes: e.target.value })}
          rows={4}
          placeholder="Bright and saline up front, with a long, almost mineral finish…"
          style={{ ...inputStyle, lineHeight: 1.55, resize: 'vertical' }}
        />
      </Field>

      <Field label="Flavor tags" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FLAVOR_TAGS.map((t) => {
            const active = draft.flavor.includes(t.label)
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => toggle(t.label)}
                aria-pressed={active}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: active ? 'var(--ink-1)' : '#fff',
                  color: active ? '#fff' : 'var(--ink-1)',
                  border: `1px solid ${active ? 'var(--ink-1)' : 'var(--line-1)'}`,
                  fontSize: 13,
                  fontWeight: active ? 500 : 450,
                  cursor: 'pointer',
                  transition: 'background 140ms, color 140ms, border-color 140ms, transform 80ms',
                  boxShadow: active ? 'var(--shadow-1)' : 'none',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: t.color,
                    boxShadow: active
                      ? `0 0 0 2px rgba(255,255,255,0.25)`
                      : `0 0 0 2px ${t.color}14`,
                    flexShrink: 0,
                  }}
                />
                {t.label}
              </button>
            )
          })}
        </div>
      </Field>
    </>
  )
}
