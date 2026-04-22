'use client'

import { useActionState, useMemo, useState } from 'react'
import { addProductAction, type AddProductResult } from './actions'

type GlobalProduct = {
  id: string
  brand: string
  expression: string
  category: string
  abv: number | null
  origin: string | null
}

const initialState: AddProductResult = { ok: true }

type Props = {
  products: GlobalProduct[]
  alreadyAddedIds: string[]
}

export function AddProductForm({ products, alreadyAddedIds }: Props) {
  const added = useMemo(() => new Set(alreadyAddedIds), [alreadyAddedIds])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [state, action, pending] = useActionState(addProductAction, initialState)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (added.has(p.id)) return false
      if (category && p.category !== category) return false
      if (!q) return true
      return (
        p.brand.toLowerCase().includes(q) ||
        p.expression.toLowerCase().includes(q) ||
        (p.origin?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [products, query, category, added])

  const selected = products.find((p) => p.id === selectedId) ?? null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28, alignItems: 'start' }}>
      <div className="card card-pad" style={{ padding: 22 }}>
        <div className="row" style={{ gap: 10, marginBottom: 14 }}>
          <input
            className="sb-input"
            placeholder="Search brand, expression, origin…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <select className="sb-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 2, maxHeight: 520, overflow: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
              {added.size === products.length
                ? 'Every bottle in the catalog is already in your workspace.'
                : 'No match. Try a different search.'}
            </div>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: selectedId === p.id ? 'var(--accent-wash)' : 'transparent',
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 10,
                alignItems: 'center',
                border: '1px solid transparent',
                borderColor: selectedId === p.id ? 'rgba(196,145,85,0.3)' : 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 120ms',
              }}
            >
              <div className="col" style={{ gap: 2 }}>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>
                  {p.brand} · <em style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>{p.expression}</em>
                </span>
                {p.origin && (
                  <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{p.origin}</span>
                )}
              </div>
              <span className="pill" style={{ fontSize: 10.5 }}>{p.category}</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
                {p.abv ? `${p.abv.toFixed(1)}%` : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      <form action={action} className="card card-pad" style={{ padding: 24, position: 'sticky', top: 96 }}>
        <div className="panel-title" style={{ marginBottom: 12 }}>
          Stock details
        </div>
        {selected ? (
          <>
            <input type="hidden" name="global_product_id" value={selected.id} />
            <div style={{ marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {selected.brand}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 24,
                  letterSpacing: '-0.01em',
                  marginTop: 4,
                }}
              >
                {selected.expression}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label className="col" style={{ gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Stock (bottles)</span>
                <input name="stock" type="number" min={0} className="sb-input" placeholder="12" />
              </label>
              <label className="col" style={{ gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Par</span>
                <input name="par" type="number" min={0} className="sb-input" placeholder="6" />
              </label>
            </div>

            <label className="col" style={{ gap: 6, marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Cost per bottle (cents)</span>
              <input name="cost_cents" type="number" min={0} className="sb-input" placeholder="4800" />
            </label>

            <label className="col" style={{ gap: 6, marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Notes</span>
              <textarea name="notes" rows={3} className="sb-input" style={{ resize: 'vertical' }} />
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
                  marginTop: 12,
                }}
              >
                {state.error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={pending}
              style={{ marginTop: 16, justifyContent: 'center' }}
            >
              {pending ? 'Adding…' : 'Add to catalog'}
            </button>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            Pick a bottle from the catalog to add it to {`your workspace`}.
          </p>
        )}
      </form>
    </div>
  )
}
