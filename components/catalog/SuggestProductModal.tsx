'use client'

import { useActionState, useState } from 'react'
import { suggestProductAction, type SuggestResult } from '@/app/(tenant)/catalog-suggestions/actions'
import { Icon } from '@/components/icons'

const initial: SuggestResult = { ok: true }

const CATEGORIES = [
  'Gin',
  'Vodka',
  'Tequila',
  'Mezcal',
  'Rum',
  'Whiskey',
  'Cognac',
  'Liqueur',
  'Vermouth',
  'Bitters',
  'Sake',
  'Wine',
  'Amaro',
  'Other',
]

type Props = { defaultQuery?: string }

export function SuggestProductModal({ defaultQuery = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(suggestProductAction, initial)
  const [submitted, setSubmitted] = useState(false)

  // Close on success after a brief delay so user sees confirmation.
  if (state.ok && submitted && open) {
    setTimeout(() => {
      setSubmitted(false)
      setOpen(false)
    }, 1200)
  }

  return (
    <>
      <button
        type="button"
        className="btn-ghost"
        style={{ fontSize: 12.5, color: 'var(--ink-3)' }}
        onClick={() => setOpen(true)}
      >
        <Icon name="plus" size={12} />
        Can&rsquo;t find it? Suggest to the shared catalog
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(25, 23, 20, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card"
            style={{
              width: 'min(560px, 94vw)',
              maxHeight: '90vh',
              overflow: 'auto',
              background: 'var(--bg)',
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--line-2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div className="page-kicker">Shared catalog</div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 22,
                    letterSpacing: '-0.01em',
                    marginTop: 2,
                  }}
                >
                  Suggest a bottle
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            {state.ok && submitted ? (
              <div style={{ padding: 36, textAlign: 'center' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    background: '#e3f0e9',
                    color: 'var(--ok)',
                    display: 'inline-grid',
                    placeItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Icon name="check" size={20} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                  Thanks — sent for review.
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: 0 }}>
                  A moderator will approve or merge it into the shared catalog. You&rsquo;ll see it
                  here once it lands.
                </p>
              </div>
            ) : (
              <form
                action={(fd: FormData) => {
                  setSubmitted(true)
                  return action(fd)
                }}
                style={{ padding: 22, display: 'grid', gap: 12 }}
              >
                <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: '0 0 4px' }}>
                  Give us enough to verify it&rsquo;s a real, commercially-available bottle. A
                  moderator reviews each submission before it joins the shared catalog.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label className="col" style={{ gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Brand *</span>
                    <input
                      name="brand"
                      className="sb-input"
                      defaultValue={defaultQuery}
                      placeholder="Aurelia Spirits"
                      required
                    />
                  </label>
                  <label className="col" style={{ gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Expression *</span>
                    <input
                      name="expression"
                      className="sb-input"
                      placeholder="Blanco"
                      required
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label className="col" style={{ gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Category *</span>
                    <select name="category" className="sb-input" required defaultValue="">
                      <option value="" disabled>
                        Choose…
                      </option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="col" style={{ gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>ABV %</span>
                    <input
                      name="abv"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      className="sb-input"
                      placeholder="40"
                    />
                  </label>
                </div>

                <label className="col" style={{ gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Origin</span>
                  <input
                    name="origin"
                    className="sb-input"
                    placeholder="Jalisco, Mexico"
                  />
                </label>

                <label className="col" style={{ gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Description</span>
                  <textarea
                    name="description"
                    rows={2}
                    className="sb-input"
                    style={{ resize: 'vertical' }}
                    placeholder="Short tasting-note style description"
                  />
                </label>

                <label className="col" style={{ gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    Note for the moderator
                  </span>
                  <textarea
                    name="note"
                    rows={2}
                    className="sb-input"
                    style={{ resize: 'vertical' }}
                    placeholder="e.g. limited edition for spring 2026"
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

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'flex-end',
                    marginTop: 6,
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={pending}>
                    {pending ? 'Sending…' : 'Send for review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
