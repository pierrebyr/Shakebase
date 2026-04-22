'use client'

import { useActionState, useState, useTransition } from 'react'
import { Icon } from '@/components/icons'
import { Stepper, STEPS, type StepIdx } from './Stepper'
import { LivePreview } from './LivePreview'
import { StepIdentity } from './steps/Identity'
import { StepRecipe } from './steps/Recipe'
import { StepMethod } from './steps/Method'
import { StepTasting } from './steps/Tasting'
import { StepReview } from './steps/Review'
import { submitCocktailDraft, type SubmitResult } from './actions'
import type { BaseProductOption, CreatorOption, Draft } from './types'

function buildInitialDraft(baseProducts: BaseProductOption[]): Draft {
  // Default to the first workspace product if the tenant owns any bottles.
  const first = baseProducts[0]
  return {
    name: '',
    spirit: first ? 'Tequila' : 'Gin',
    base_product_id: first?.id ?? '',
    category: 'Stirred',
    glass: 'Coupe',
    creator_id: '',
    color1: first?.color_hex ?? '#f4efe0',
    color2: first ? '#a08b5d' : '#c9b89a',
    photo_data_url: null,
    photo_filename: null,
    ingredients: [
      { name: '', amount: '', unit: 'ml' },
      { name: '', amount: '', unit: 'ml' },
    ],
    method: '',
    tasting_notes: '',
    flavor: [],
  }
}

const initialState: SubmitResult = { ok: true }

export function NewCocktailWizard({
  creators,
  baseProducts,
}: {
  creators: CreatorOption[]
  baseProducts: BaseProductOption[]
}) {
  const [draft, setDraft] = useState<Draft>(() => buildInitialDraft(baseProducts))
  const [step, setStep] = useState<StepIdx>(1)
  const [state, action, pending] = useActionState(submitCocktailDraft, initialState)
  const [, startTransition] = useTransition()

  function update(patch: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...patch }))
  }

  function submit(status: 'draft' | 'published') {
    if (draft.name.trim().length < 2) {
      setStep(1)
      return
    }
    const payload = JSON.stringify({ ...draft, status })
    const fd = new FormData()
    fd.set('payload', payload)
    startTransition(() => action(fd))
  }

  return (
    <>
      <Stepper step={step} onGoTo={setStep} />

      <div className="wizard-grid">
        <div className="card card-pad wizard-form" style={{ padding: 28 }}>
          {step === 1 && (
            <StepIdentity
              draft={draft}
              update={update}
              creators={creators}
              baseProducts={baseProducts}
            />
          )}
          {step === 2 && <StepRecipe draft={draft} update={update} />}
          {step === 3 && <StepMethod draft={draft} update={update} />}
          {step === 4 && <StepTasting draft={draft} update={update} />}
          {step === 5 && (
            <StepReview
              submitDraft={() => submit('draft')}
              submitPublish={() => submit('published')}
              pending={pending}
            />
          )}

          {!state.ok && (
            <div
              role="alert"
              style={{
                fontSize: 12.5,
                color: 'var(--crit)',
                background: '#fdf0f0',
                border: '1px solid #f0cccc',
                padding: '10px 14px',
                borderRadius: 10,
                marginTop: 18,
              }}
            >
              {state.error}
            </div>
          )}

          <div className="hr" style={{ margin: '28px 0 18px' }} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn-ghost"
              disabled={step === 1 || pending}
              onClick={() => setStep((s) => Math.max(1, s - 1) as StepIdx)}
              style={{ opacity: step === 1 ? 0.4 : 1 }}
            >
              <Icon name="chevron-l" size={12} /> Back
            </button>
            {step < STEPS.length && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setStep((s) => Math.min(STEPS.length, s + 1) as StepIdx)}
                disabled={pending}
              >
                Continue <Icon name="chevron-r" size={12} />
              </button>
            )}
          </div>
        </div>

        <LivePreview draft={draft} />
      </div>
    </>
  )
}
