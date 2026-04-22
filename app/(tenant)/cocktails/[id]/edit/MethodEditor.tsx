'use client'

import { useActionState, useState } from 'react'
import { updateMethodAction, type MutationResult } from './actions'
import { Icon } from '@/components/icons'

type Step = { step: number; text: string }

const initialState: MutationResult = { ok: true }

export function MethodEditor({ id, initial }: { id: string; initial: Step[] }) {
  const [steps, setSteps] = useState<Step[]>(initial.length > 0 ? initial : [{ step: 1, text: '' }])
  const [state, action, pending] = useActionState(updateMethodAction, initialState)

  function addStep() {
    setSteps((s) => [...s, { step: s.length + 1, text: '' }])
  }
  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i).map((r, idx) => ({ step: idx + 1, text: r.text })))
  }
  function updateStep(i: number, text: string) {
    setSteps((s) => s.map((r, idx) => (idx === i ? { ...r, text } : r)))
  }
  function move(i: number, direction: -1 | 1) {
    setSteps((s) => {
      const j = i + direction
      if (j < 0 || j >= s.length) return s
      const copy = [...s]
      ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
      return copy.map((r, idx) => ({ ...r, step: idx + 1 }))
    })
  }

  return (
    <form action={action} className="card card-pad" style={{ padding: 28 }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="steps" value={JSON.stringify(steps)} />

      <div className="panel-title" style={{ marginBottom: 18 }}>
        Method
      </div>

      <div className="col" style={{ gap: 10 }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr auto',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <div
              className="mono"
              style={{
                paddingTop: 10,
                color: 'var(--ink-4)',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              {s.step}.
            </div>
            <textarea
              value={s.text}
              onChange={(e) => updateStep(i, e.target.value)}
              rows={2}
              className="sb-input"
              placeholder="Combine tequila, lime, and agave in a shaker with ice. Shake until frost forms."
              style={{ resize: 'vertical' }}
            />
            <div className="col" style={{ gap: 4 }}>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="icon-btn" title="Move up" style={{ opacity: i === 0 ? 0.3 : 1 }}>
                <Icon name="arrow-up" size={13} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="icon-btn" title="Move down" style={{ opacity: i === steps.length - 1 ? 0.3 : 1 }}>
                <Icon name="arrow-down" size={13} />
              </button>
              <button type="button" onClick={() => removeStep(i)} className="icon-btn" title="Remove step" style={{ color: 'var(--crit)' }}>
                <Icon name="x" size={13} />
              </button>
            </div>
          </div>
        ))}

        <button type="button" onClick={addStep} className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 6 }}>
          <Icon name="plus" size={12} /> Add step
        </button>

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
          <div style={{ fontSize: 12, color: 'var(--ok)' }}>Method saved.</div>
        )}

        <button type="submit" className="btn-primary" disabled={pending} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
          {pending ? 'Saving…' : 'Save method'}
        </button>
      </div>
    </form>
  )
}
