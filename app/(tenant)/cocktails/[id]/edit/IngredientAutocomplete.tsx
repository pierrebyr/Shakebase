'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Icon } from '@/components/icons'
import {
  addIngredientFromAutocompleteAction,
  searchIngredientsAction,
  type IngredientHit,
} from './ingredient-autocomplete-actions'

export function IngredientAutocomplete({ cocktailId }: { cocktailId: string }) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<IngredientHit[]>([])
  const [selected, setSelected] = useState<IngredientHit | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('ml')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (selected && selected.name === query) return
    if (query.trim().length === 0) {
      setHits([])
      setOpen(false)
      return
    }
    const t = setTimeout(async () => {
      const results = await searchIngredientsAction(query, 8)
      setHits(results)
      setActiveIdx(0)
      setOpen(true)
    }, 120)
    return () => clearTimeout(t)
  }, [query, selected])

  // Click-outside closes the dropdown
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const exactMatch = hits.find(
    (h) => h.name.toLowerCase() === query.trim().toLowerCase(),
  )

  const choose = (h: IngredientHit) => {
    setSelected(h)
    setQuery(h.name)
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    const total = hits.length + (exactMatch || query.trim().length < 2 ? 0 : 1)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % Math.max(total, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + total) % Math.max(total, 1))
    } else if (e.key === 'Enter') {
      const hit = hits[activeIdx]
      if (activeIdx < hits.length && hit) {
        e.preventDefault()
        choose(hit)
      } else if (!exactMatch && query.trim().length >= 2) {
        // "Create new" row selected
        e.preventDefault()
        // Let submit handler create it
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const submit = () => {
    setError(null)
    const amt = amount.trim() ? Number(amount) : null
    if (amt != null && Number.isNaN(amt)) {
      setError('Amount must be a number')
      return
    }
    const trimmed = query.trim()
    const input = {
      cocktail_id: cocktailId,
      selected: selected ? { kind: selected.kind, id: selected.id } : null,
      new_name: selected ? null : trimmed.length >= 2 ? trimmed : null,
      amount: amt,
      unit: unit.trim() || null,
      notes: notes.trim() || null,
    }
    if (!input.selected && !input.new_name) {
      setError('Pick an ingredient or type a name')
      return
    }
    startTransition(async () => {
      const res = await addIngredientFromAutocompleteAction(input)
      if ('error' in res && res.error) {
        setError(res.error)
        return
      }
      // Reset form
      setQuery('')
      setSelected(null)
      setHits([])
      setOpen(false)
      setAmount('')
      setNotes('')
      setUnit('ml')
      setActiveIdx(0)
    })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 90px 70px',
        gap: 10,
        alignItems: 'end',
      }}
    >
      <label className="col" style={{ gap: 6, minWidth: 0, position: 'relative' }}>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Ingredient</span>
        <div ref={wrapRef} style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            className="sb-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
            }}
            onFocus={() => {
              if (hits.length > 0) setOpen(true)
            }}
            onKeyDown={onKeyDown}
            placeholder="Search — e.g. Fresh Lime Juice, Cointreau…"
            autoComplete="off"
          />
          {selected && (
            <span
              className="mono"
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 10,
                color: selected.kind === 'workspace' ? 'var(--accent-ink)' : 'var(--ink-4)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
              }}
            >
              {selected.kind === 'workspace' ? 'Workspace' : selected.category || 'Global'}
            </span>
          )}
          {open && (hits.length > 0 || (query.trim().length >= 2 && !exactMatch)) && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: 'var(--bg-elev)',
                border: '1px solid var(--line-1)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-2, 0 12px 32px rgba(0,0,0,0.12))',
                maxHeight: 280,
                overflowY: 'auto',
                padding: 4,
                zIndex: 20,
              }}
            >
              {hits.map((h, i) => (
                <button
                  key={`${h.kind}-${h.id}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(h)}
                  onMouseEnter={() => setActiveIdx(i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    border: 'none',
                    background: i === activeIdx ? 'var(--bg-sunken)' : 'transparent',
                    cursor: 'pointer',
                    borderRadius: 8,
                    textAlign: 'left',
                    fontSize: 13,
                    color: 'var(--ink-1)',
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.name}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 9.5,
                      color: h.kind === 'workspace' ? 'var(--accent-ink)' : 'var(--ink-4)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h.kind === 'workspace' ? 'Workspace' : h.category || 'Global'}
                  </span>
                </button>
              ))}
              {!exactMatch && query.trim().length >= 2 && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={submit}
                  onMouseEnter={() => setActiveIdx(hits.length)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    border: 'none',
                    background:
                      activeIdx === hits.length ? 'var(--accent-wash)' : 'transparent',
                    cursor: 'pointer',
                    borderRadius: 8,
                    textAlign: 'left',
                    fontSize: 13,
                    color: 'var(--accent-ink)',
                    borderTop: hits.length > 0 ? '1px solid var(--line-2)' : 'none',
                    marginTop: hits.length > 0 ? 4 : 0,
                  }}
                >
                  <Icon name="plus" size={12} />
                  <span>
                    Create <strong>&ldquo;{query.trim()}&rdquo;</strong> in shared catalog
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </label>

      <label className="col" style={{ gap: 6 }}>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Amount</span>
        <input
          className="sb-input"
          type="number"
          step="0.1"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="45"
        />
      </label>

      <label className="col" style={{ gap: 6 }}>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Unit</span>
        <input
          className="sb-input"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="ml"
        />
      </label>

      <label className="col" style={{ gap: 6, gridColumn: 'span 3' }}>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Notes</span>
        <input
          className="sb-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="freshly pressed"
        />
      </label>

      {error && (
        <div
          role="alert"
          style={{
            gridColumn: 'span 3',
            fontSize: 12.5,
            color: 'var(--crit)',
            background: '#fdf0f0',
            border: '1px solid #f0cccc',
            padding: '8px 12px',
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="btn-primary"
        style={{ gridColumn: 'span 3', justifySelf: 'flex-start' }}
      >
        <Icon name="plus" size={12} />
        {pending ? 'Adding…' : 'Add ingredient'}
      </button>
    </div>
  )
}
