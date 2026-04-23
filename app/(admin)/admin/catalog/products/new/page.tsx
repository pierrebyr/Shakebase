import Link from 'next/link'
import { createProductAction } from './actions'

export const dynamic = 'force-dynamic'

export default function NewProductPage() {
  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            <Link href="/admin/catalog" style={{ color: 'var(--op-ink-3)' }}>
              ← Catalog
            </Link>
          </div>
          <h1 className="op-title">
            New <span className="it">canonical product.</span>
          </h1>
          <p className="op-sub">
            Adds a row to <code>global_products</code>. All workspaces see it immediately in their
            autocomplete.
          </p>
        </div>
      </div>

      <form
        action={createProductAction}
        className="op-card"
        style={{ padding: 22, maxWidth: 820 }}
      >
        <Section title="Identity">
          <Row>
            <Field label="Brand" required>
              <input name="brand" required minLength={1} className="op-input" autoFocus />
            </Field>
            <Field label="Expression" required>
              <input name="expression" required minLength={1} className="op-input" />
            </Field>
          </Row>
          <Row>
            <Field label="Category" required>
              <input
                name="category"
                required
                placeholder="Tequila, Mezcal, Rum…"
                className="op-input"
              />
            </Field>
            <Field label="ABV %">
              <input
                name="abv"
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="op-input"
              />
            </Field>
          </Row>
          <Row>
            <Field label="Origin">
              <input name="origin" placeholder="Jalisco, Mexico" className="op-input" />
            </Field>
            <Field label="Volume (ml)">
              <input
                name="volume_ml"
                type="number"
                min="0"
                max="5000"
                defaultValue="750"
                className="op-input"
              />
            </Field>
          </Row>
        </Section>

        <Section title="Copy">
          <Field label="Tagline">
            <input name="tagline" maxLength={200} className="op-input" />
          </Field>
          <Field label="Description">
            <textarea name="description" maxLength={1000} rows={3} className="op-input" />
          </Field>
          <Field label="Tasting notes">
            <textarea name="tasting_notes" maxLength={1000} rows={3} className="op-input" />
          </Field>
        </Section>

        <Section title="Visual">
          <Row>
            <Field label="Image URL">
              <input name="image_url" placeholder="https://…" className="op-input" />
            </Field>
            <Field label="Color hex">
              <input name="color_hex" placeholder="#efe6c9" className="op-input" />
            </Field>
          </Row>
        </Section>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            borderTop: '1px solid var(--op-line)',
            paddingTop: 18,
          }}
        >
          <Link href="/admin/catalog" className="op-btn ghost">
            Cancel
          </Link>
          <button type="submit" className="op-btn primary">
            Create product
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        className="eyebrow"
        style={{
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid var(--op-line)',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
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
