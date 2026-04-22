'use client'

import { Icon } from '@/components/icons'

export const STEPS = ['Identity', 'Recipe', 'Method', 'Tasting', 'Review'] as const
export type StepIdx = 1 | 2 | 3 | 4 | 5

type Props = {
  step: StepIdx
  onGoTo: (s: StepIdx) => void
}

export function Stepper({ step, onGoTo }: Props) {
  return (
    <div className="wizard-steps" style={{ marginBottom: 32 }}>
      {STEPS.map((label, i) => {
        const idx = (i + 1) as StepIdx
        const isPast = idx < step
        const isCurrent = idx === step
        const reachable = idx <= step
        return (
          <span
            key={label}
            className="wizard-steps-item"
            data-last={i === STEPS.length - 1 ? 'true' : 'false'}
          >
            <button
              type="button"
              onClick={() => reachable && onGoTo(idx)}
              disabled={!reachable}
              className="wizard-steps-btn"
              style={{
                opacity: reachable ? 1 : 0.4,
                cursor: reachable ? 'pointer' : 'not-allowed',
              }}
            >
              <span
                className="wizard-steps-dot"
                style={{
                  background: isPast ? 'var(--ink-1)' : isCurrent ? 'var(--accent)' : 'var(--bg-sunken)',
                  color: reachable ? '#fff' : 'var(--ink-4)',
                }}
              >
                {isPast ? <Icon name="check" size={12} /> : idx}
              </span>
              <span
                className="wizard-steps-label"
                style={{
                  fontWeight: isCurrent ? 500 : 400,
                  color: isCurrent ? 'var(--ink-1)' : 'var(--ink-3)',
                }}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && <span className="wizard-steps-rule" />}
          </span>
        )
      })}
    </div>
  )
}
