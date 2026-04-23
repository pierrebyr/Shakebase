import Link from 'next/link'
import { createIngredientAction } from './actions'

export const dynamic = 'force-dynamic'

export default function NewIngredientPage() {
  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            <Link href="/admin/catalog?tab=ingredients" style={{ color: 'var(--op-ink-3)' }}>
              ← Catalog · Ingredients
            </Link>
          </div>
          <h1 className="op-title">
            New <span className="it">canonical ingredient.</span>
          </h1>
          <p className="op-sub">
            Adds a row to <code>global_ingredients</code>. Available to every workspace.
          </p>
        </div>
      </div>

      <form
        action={createIngredientAction}
        className="op-card"
        style={{ padding: 22, maxWidth: 620 }}
      >
        <Field label="Name" required>
          <input name="name" required minLength={1} className="op-input" autoFocus />
        </Field>
        <div style={{ height: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Category">
            <input
              name="category"
              placeholder="citrus, syrup, bitters…"
              className="op-input"
            />
          </Field>
          <Field label="Default unit">
            <input
              name="default_unit"
              placeholder="oz, ml, dash…"
              maxLength={16}
              className="op-input"
            />
          </Field>
        </div>
        <div style={{ height: 12 }} />
        <Field label="Allergens (comma-separated)">
          <input
            name="allergens"
            placeholder="dairy, nuts, gluten…"
            className="op-input"
          />
        </Field>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            borderTop: '1px solid var(--op-line)',
            paddingTop: 18,
            marginTop: 22,
          }}
        >
          <Link href="/admin/catalog?tab=ingredients" className="op-btn ghost">
            Cancel
          </Link>
          <button type="submit" className="op-btn primary">
            Create ingredient
          </button>
        </div>
      </form>

      <style>
        {`
          .op-input {
            width: 100%;
            padding: 9px 12px;
            background: var(--op-surface);
            border: 1px solid var(--op-line);
            border-radius: 8px;
            color: var(--op-ink-1);
            font-size: 13px;
            font-family: inherit;
            outline: none;
          }
          .op-input:focus { border-color: var(--op-accent); }
        `}
      </style>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="eyebrow" style={{ fontSize: 9.5, color: 'var(--op-ink-4)' }}>
        {label}
        {required && <span style={{ color: 'var(--op-crit)', marginLeft: 4 }}>*</span>}
      </span>
      {children}
    </label>
  )
}
