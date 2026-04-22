'use client'

import { Icon } from '@/components/icons'
import type { Draft } from '../types'
import { Field, inputStyle } from './Identity'

type Step = { text: string }

// Parse textarea input into distinct steps, one per non-empty line.
function parseSteps(text: string): Step[] {
  return text
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((text) => ({ text }))
}

function stringify(steps: Step[]): string {
  return steps.map((s) => s.text).join('\n')
}

export function StepMethod({
  draft,
  update,
}: {
  draft: Draft
  update: (patch: Partial<Draft>) => void
}) {
  const steps = parseSteps(draft.method)

  function addStep() {
    const next = [...steps, { text: '' }]
    update({ method: stringify(next) })
  }
  function updateAt(i: number, text: string) {
    const next = steps.map((s, idx) => (idx === i ? { text } : s))
    update({ method: stringify(next) })
  }
  function removeAt(i: number) {
    const next = steps.filter((_, idx) => idx !== i)
    update({ method: stringify(next) })
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    update({ method: stringify(next) })
  }

  // Always render at least one empty row so the UI doesn't feel dead on first open.
  const rows = steps.length === 0 ? [{ text: '' }] : steps

  return (
    <>
      <Field label="Method · one step per card">
        <div className="col" style={{ gap: 10 }}>
          {rows.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto',
                gap: 12,
                padding: 14,
                border: '1px solid var(--line-2)',
                borderRadius: 14,
                background: '#fff',
                alignItems: 'flex-start',
                transition: 'border-color 140ms',
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: 'var(--accent-wash)',
                  color: 'var(--accent-ink)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <textarea
                value={s.text}
                onChange={(e) => updateAt(i, e.target.value)}
                rows={2}
                placeholder={
                  i === 0
                    ? 'Stir over ice for 22 seconds.'
                    : i === 1
                      ? 'Strain into a chilled coupe.'
                      : 'Describe the step…'
                }
                style={{
                  ...inputStyle,
                  border: 'none',
                  padding: '6px 0',
                  resize: 'vertical',
                  fontSize: 14,
                  lineHeight: 1.55,
                  minHeight: 44,
                  background: 'transparent',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="icon-btn"
                  style={{ opacity: i === 0 ? 0.3 : 1, width: 28, height: 28 }}
                  title="Move up"
                >
                  <Icon name="arrow-up" size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1 || rows.length <= 1}
                  className="icon-btn"
                  style={{
                    opacity: i === rows.length - 1 || rows.length <= 1 ? 0.3 : 1,
                    width: 28,
                    height: 28,
                  }}
                  title="Move down"
                >
                  <Icon name="arrow-down" size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="icon-btn"
                  disabled={rows.length <= 1}
                  style={{
                    color: 'var(--crit)',
                    opacity: rows.length <= 1 ? 0.3 : 1,
                    width: 28,
                    height: 28,
                  }}
                  title="Remove"
                >
                  <Icon name="x" size={11} />
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={addStep} className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
            <Icon name="plus" size={12} />
            Add step
          </button>
        </div>
      </Field>
    </>
  )
}
