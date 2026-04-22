'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addWorkspaceIngredient, type AddIngredientResult } from './actions'

const initialState: AddIngredientResult = { ok: true }

export function AddWorkspaceIngredientForm() {
  const [state, action, pending] = useActionState(addWorkspaceIngredient, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="card card-pad" style={{ padding: 22 }}>
      <div className="panel-title" style={{ marginBottom: 12 }}>
        Add an ingredient
      </div>
      <div className="col" style={{ gap: 10 }}>
        <input name="name" required placeholder="House clarified lime" className="sb-input" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input name="category" placeholder="citrus" className="sb-input" />
          <input name="default_unit" defaultValue="ml" placeholder="ml" className="sb-input" />
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
        <button type="submit" className="btn-primary" disabled={pending} style={{ justifyContent: 'center' }}>
          {pending ? 'Adding…' : 'Add to pantry'}
        </button>
      </div>
    </form>
  )
}
