'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icons'

export type IngredientRow = {
  slug: string
  displayName: string
  count: number
  category: string | null
  linkedId: string | null
}

type SortKey = 'Usage' | 'A–Z'

export function IngredientBrowser({ ingredients }: { ingredients: IngredientRow[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<SortKey>('Usage')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ing of ingredients) set.add(ing.category ?? 'Other')
    return ['All', ...[...set].sort((a, b) => {
      if (a === 'Other') return 1
      if (b === 'Other') return -1
      return a.localeCompare(b)
    })]
  }, [ingredients])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const arr = ingredients.filter((ing) => {
      if (category !== 'All') {
        const cat = ing.category ?? 'Other'
        if (cat !== category) return false
      }
      if (needle && !ing.displayName.toLowerCase().includes(needle)) return false
      return true
    })
    arr.sort((a, b) => {
      if (sort === 'A–Z') return a.displayName.localeCompare(b.displayName)
      if (b.count !== a.count) return b.count - a.count
      return a.displayName.localeCompare(b.displayName)
    })
    return arr
  }, [ingredients, search, category, sort])

  // Group filtered results by category for display (respects the filter)
  const grouped = useMemo(() => {
    const byCat = new Map<string, IngredientRow[]>()
    for (const ing of filtered) {
      const cat = ing.category ?? 'Other'
      const list = byCat.get(cat) ?? []
      list.push(ing)
      byCat.set(cat, list)
    }
    const keys = [...byCat.keys()].sort((a, b) => {
      if (a === 'Other') return 1
      if (b === 'Other') return -1
      return a.localeCompare(b)
    })
    return keys.map((k) => ({ key: k, rows: byCat.get(k) ?? [] }))
  }, [filtered])

  const hasFilter = category !== 'All' || search.trim().length > 0

  // When filtering, auto-expand every category that has matches so users
  // can see hits immediately. Revert to collapsed when cleared.
  useEffect(() => {
    if (hasFilter) {
      setExpanded(new Set(grouped.map((g) => g.key)))
    } else {
      setExpanded(new Set())
    }
  }, [hasFilter, grouped])

  const toggleCategory = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const expandAll = () => setExpanded(new Set(grouped.map((g) => g.key)))
  const collapseAll = () => setExpanded(new Set())

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180, maxWidth: 320 }}>
          <Icon
            name="search"
            size={12}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-4)',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients…"
            style={{
              width: '100%',
              padding: '7px 10px 7px 28px',
              fontSize: 12.5,
              border: '1px solid var(--line-1)',
              borderRadius: 999,
              outline: 'none',
              background: '#fff',
            }}
          />
        </div>

        {/* Category filter */}
        <FilterSelect
          label="Category"
          value={category}
          options={categoryOptions}
          onChange={setCategory}
        />

        {hasFilter && (
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 11.5 }}
            onClick={() => {
              setCategory('All')
              setSearch('')
            }}
          >
            <Icon name="x" size={11} /> Clear
          </button>
        )}

        {/* Sort */}
        <div style={{ marginLeft: 'auto' }} className="seg">
          {(['Usage', 'A–Z'] as SortKey[]).map((s) => (
            <button
              key={s}
              type="button"
              data-active={sort === s}
              onClick={() => setSort(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-4)',
          marginBottom: 14,
        }}
      >
        {filtered.length} of {ingredients.length} ingredient
        {ingredients.length === 1 ? '' : 's'}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--ink-4)',
            fontSize: 13,
            border: '1px dashed var(--line-1)',
            borderRadius: 12,
          }}
        >
          No match.{' '}
          <button
            type="button"
            onClick={() => {
              setCategory('All')
              setSearch('')
            }}
            style={{ color: 'var(--accent-ink)', fontWeight: 500 }}
          >
            Reset →
          </button>
        </div>
      ) : sort === 'A–Z' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {filtered.map((ing) => (
            <IngredientPill key={ing.slug} ing={ing} />
          ))}
        </div>
      ) : (
        <div>
          <div
            className="row gap-sm"
            style={{ marginBottom: 12, justifyContent: 'flex-end' }}
          >
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: 11 }}
              onClick={expanded.size === grouped.length ? collapseAll : expandAll}
            >
              {expanded.size === grouped.length ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {grouped.map((g) => {
              const isOpen = expanded.has(g.key)
              return (
                <div
                  key={g.key}
                  style={{
                    border: '1px solid var(--line-2)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: '#fff',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(g.key)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: 10,
                    }}
                  >
                    <span
                      className="row gap-sm"
                      style={{ alignItems: 'center', flex: 1, minWidth: 0 }}
                    >
                      <Icon
                        name={isOpen ? 'chevron-d' : 'chevron-r'}
                        size={12}
                        style={{ color: 'var(--ink-4)', flexShrink: 0 }}
                      />
                      <span
                        className="mono"
                        style={{
                          fontSize: 10.5,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-2)',
                          fontWeight: 500,
                        }}
                      >
                        {g.key}
                      </span>
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: 10.5, color: 'var(--ink-4)' }}
                    >
                      {g.rows.length}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '4px 14px 14px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        borderTop: '1px solid var(--line-2)',
                      }}
                    >
                      {g.rows.map((ing) => (
                        <IngredientPill key={ing.slug} ing={ing} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

function IngredientPill({ ing }: { ing: IngredientRow }) {
  return (
    <Link
      href={`/ingredients/${ing.linkedId ?? ing.slug}`}
      className="pill ingredient-pill"
    >
      {ing.displayName}
      <span
        className="mono"
        style={{ fontSize: 10, color: 'var(--ink-4)', marginLeft: 2 }}
      >
        {ing.count}
      </span>
    </Link>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const active = value !== 'All'
  return (
    <label
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 28px 7px 12px',
        borderRadius: 999,
        border: '1px solid var(--line-1)',
        background: active ? 'var(--accent-wash)' : '#fff',
        color: active ? 'var(--accent-ink)' : 'var(--ink-2)',
        fontSize: 12,
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'var(--ink-4)' }}>{label}:</span>
      <span>{value}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          border: 0,
          background: 'transparent',
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-d"
        size={11}
        style={{
          position: 'absolute',
          right: 10,
          pointerEvents: 'none',
          color: 'var(--ink-4)',
        }}
      />
    </label>
  )
}
