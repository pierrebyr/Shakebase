'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CocktailCard,
  type CocktailCardData,
  type CollectionOption,
} from '@/components/cocktail/CocktailCard'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import { GlassIcon } from '@/components/cocktail/GlassIcon'
import { Avatar } from '@/components/cocktail/Avatar'
import { Icon } from '@/components/icons'

export type LibraryCocktail = CocktailCardData & {
  season: string[]
  occasions: string[]
  flavor_profile: string[]
  menu_price_cents: number | null
  created_at: string | null
  updated_at: string | null
}

type SortKey = 'Newest' | 'Price' | 'A–Z' | 'Updated'
type ViewMode = 'grid' | 'list'

const SORTS: SortKey[] = ['Updated', 'Newest', 'Price', 'A–Z']

type Props = { cocktails: LibraryCocktail[]; allCollections: CollectionOption[] }

export function LibraryBrowser({ cocktails, allCollections }: Props) {
  const [spirit, setSpirit] = useState('All')
  const [category, setCategory] = useState('All')
  const [season, setSeason] = useState('All')
  const [occasion, setOccasion] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('Updated')
  const [view, setView] = useState<ViewMode>('grid')

  const { options, monoSpirit } = useMemo(() => {
    const spirits = new Set<string>()
    const products = new Set<string>()
    const categories = new Set<string>()
    const occasionsSet = new Set<string>()
    for (const c of cocktails) {
      if (c.spirit_base) spirits.add(c.spirit_base)
      if (c.base_product_expression) products.add(c.base_product_expression)
      if (c.category) categories.add(c.category)
      for (const o of c.occasions) occasionsSet.add(o)
    }
    // If every cocktail in this workspace pours the same spirit family,
    // the "Spirit" filter is useless noise — pivot to a Product filter
    // showing the specific expressions (Blanco / Añejo / Joven / etc.).
    const mono = spirits.size <= 1 && products.size >= 2
    return {
      monoSpirit: mono,
      options: {
        spirits: ['All', ...[...spirits].sort()],
        products: ['All', ...[...products].sort()],
        categories: ['All', ...[...categories].sort()],
        occasions: ['All', ...[...occasionsSet].sort()],
        seasons: ['All', 'Spring', 'Summer', 'Autumn', 'Winter'],
      },
    }
  }, [cocktails])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const arr = cocktails.filter((c) => {
      if (spirit !== 'All') {
        if (monoSpirit) {
          if (c.base_product_expression !== spirit) return false
        } else if (c.spirit_base !== spirit) return false
      }
      if (category !== 'All' && c.category !== category) return false
      if (season !== 'All' && !c.season.includes(season)) return false
      if (occasion !== 'All' && !c.occasions.includes(occasion)) return false
      if (needle) {
        const hay = [
          c.name,
          c.spirit_base,
          c.category,
          c.creator_name,
          c.glass_type,
          ...c.flavor_profile,
          ...c.season,
          ...c.occasions,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    arr.sort((a, b) => {
      if (sort === 'Newest') {
        return (b.created_at ?? '').localeCompare(a.created_at ?? '')
      }
      if (sort === 'Updated') {
        return (b.updated_at ?? '').localeCompare(a.updated_at ?? '')
      }
      if (sort === 'Price') {
        return (b.menu_price_cents ?? 0) - (a.menu_price_cents ?? 0)
      }
      return a.name.localeCompare(b.name)
    })
    return arr
  }, [cocktails, spirit, category, season, occasion, search, sort])

  const hasFilter =
    spirit !== 'All' || category !== 'All' || season !== 'All' || occasion !== 'All'

  // Track library searches — debounced, so a single query is logged once
  // after the user stops typing, not on every keystroke.
  const filteredCount = filtered.length
  useEffect(() => {
    const q = search.trim()
    if (q.length < 2) return
    const timer = setTimeout(() => {
      const body = JSON.stringify({
        events: [
          {
            kind: 'search.query',
            metadata: { q, scope: 'cocktails', result_count: filteredCount },
          },
        ],
      })
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' })
          if (navigator.sendBeacon('/api/activity', blob)) return
        }
      } catch {
        // fall through to fetch
      }
      void fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }, 800)
    return () => clearTimeout(timer)
  }, [search, filteredCount])

  function clearAll() {
    setSpirit('All')
    setCategory('All')
    setSeason('All')
    setOccasion('All')
  }

  return (
    <>
      {/* Filter bar */}
      <div
        className="card"
        style={{
          padding: '10px 14px',
          marginBottom: 24,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Icon
          name="filter"
          size={14}
          style={{ color: 'var(--ink-4)', marginLeft: 4, marginRight: 2 }}
        />

        {/* Hide the Spirit/Product filter entirely when there's only one
            distinct value to choose from — it's pure noise otherwise. */}
        {monoSpirit && options.products.length > 2 ? (
          <FilterSelect
            label="Product"
            value={spirit}
            options={options.products}
            onChange={setSpirit}
          />
        ) : !monoSpirit && options.spirits.length > 2 ? (
          <FilterSelect
            label="Spirit"
            value={spirit}
            options={options.spirits}
            onChange={setSpirit}
          />
        ) : null}
        <FilterSelect label="Category" value={category} options={options.categories} onChange={setCategory} />
        <FilterSelect label="Season" value={season} options={options.seasons} onChange={setSeason} />
        <FilterSelect label="Occasion" value={occasion} options={options.occasions} onChange={setOccasion} />

        {hasFilter && (
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 11.5 }}
            onClick={clearAll}
          >
            <Icon name="x" size={11} /> Clear
          </button>
        )}

        {/* Search */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 180px',
            minWidth: 160,
            maxWidth: 260,
          }}
        >
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
            placeholder="Search name, flavor, creator…"
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

        {/* View toggle + sort */}
        <div style={{ marginLeft: 'auto' }} className="row gap-sm">
          <div className="seg">
            {SORTS.map((s) => (
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
          <div className="seg">
            <button
              type="button"
              data-active={view === 'grid'}
              onClick={() => setView('grid')}
              title="Grid"
            >
              <Icon name="grid" size={13} />
            </button>
            <button
              type="button"
              data-active={view === 'list'}
              onClick={() => setView('list')}
              title="List"
            >
              <Icon name="list" size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Count */}
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
        {filtered.length} of {cocktails.length} spec{cocktails.length === 1 ? '' : 's'}
      </div>

      {filtered.length === 0 ? (
        <div
          className="card card-pad"
          style={{
            padding: 48,
            textAlign: 'center',
            color: 'var(--ink-3)',
            fontSize: 13,
          }}
        >
          No cocktails match these filters.{' '}
          <button
            type="button"
            onClick={() => {
              clearAll()
              setSearch('')
            }}
            style={{ color: 'var(--accent-ink)', fontWeight: 500 }}
          >
            Reset →
          </button>
        </div>
      ) : view === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--density-gap)',
          }}
        >
          {filtered.map((c) => (
            <CocktailCard key={c.id} c={c} allCollections={allCollections} />
          ))}
        </div>
      ) : (
        <CocktailTable rows={filtered} monoSpirit={monoSpirit} />
      )}
    </>
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

function dollars(cents: number | null): string {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

function relDate(iso: string | null): string {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function CocktailTable({ rows, monoSpirit }: { rows: LibraryCocktail[]; monoSpirit: boolean }) {
  const spiritHeader = monoSpirit ? 'Product' : 'Spirit'
  const cols = '48px 2fr 1fr 1fr 1fr 90px 110px'
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cols,
          padding: '12px 20px',
          borderBottom: '1px solid var(--line-1)',
          background: 'var(--bg-sunken)',
        }}
      >
        {['', 'Cocktail', spiritHeader, 'Glass', 'Creator', 'Price', 'Updated'].map((h) => (
          <div
            key={h}
            className="mono"
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              color: 'var(--ink-4)',
              letterSpacing: '0.1em',
            }}
          >
            {h}
          </div>
        ))}
      </div>
      {rows.map((c, i) => (
        <Link
          key={c.id}
          href={`/cocktails/${c.slug}`}
          style={{
            display: 'grid',
            gridTemplateColumns: cols,
            padding: '14px 20px',
            borderTop: i > 0 ? '1px solid var(--line-2)' : 'none',
            alignItems: 'center',
            color: 'inherit',
            transition: 'background 100ms',
          }}
        >
          <DrinkOrb from={c.orb_from ?? '#f4efe0'} to={c.orb_to ?? '#c9b89a'} size={28} />
          <div className="col" style={{ minWidth: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--ink-4)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.flavor_profile.length > 0 ? c.flavor_profile.join(' · ') : c.category ?? '—'}
            </span>
          </div>
          <div style={{ fontSize: 12.5 }}>
            {c.base_product_expression ?? c.spirit_base ?? '—'}
          </div>
          <div className="row gap-sm" style={{ minWidth: 0 }}>
            {c.glass_type ? (
              <>
                <GlassIcon glass={c.glass_type} size={16} className="" />
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.glass_type}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>—</span>
            )}
          </div>
          <div className="row gap-sm" style={{ minWidth: 0 }}>
            {c.creator_name ? (
              <>
                <Avatar name={c.creator_name} size={20} />
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.creator_name.split(' ')[0]}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>Unattributed</span>
            )}
          </div>
          <div className="mono" style={{ fontSize: 12 }}>
            {dollars(c.menu_price_cents)}
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {relDate(c.updated_at)}
          </div>
        </Link>
      ))}
    </div>
  )
}
