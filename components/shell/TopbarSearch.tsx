'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/icons'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import { Avatar } from '@/components/cocktail/Avatar'
import { topbarSearchAction, type SearchHit, type SearchResult } from './search-action'

export function TopbarSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced fetch
  useEffect(() => {
    if (query.trim().length < 1) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      const data = await topbarSearchAction(query)
      setResults(data)
      setActiveIdx(0)
      setOpen(true)
      setLoading(false)
    }, 160)
    return () => clearTimeout(t)
  }, [query])

  // Close on click-outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ⌘K / Ctrl+K focus
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const allHits: SearchHit[] = results
    ? [...results.cocktails, ...results.creators, ...results.ingredients]
    : []

  const navigate = (hit: SearchHit) => {
    setOpen(false)
    setQuery('')
    if (hit.kind === 'cocktail') router.push(`/cocktails/${hit.id}`)
    else if (hit.kind === 'creator') router.push(`/creators/${hit.id}`)
    else router.push(`/ingredients/${hit.id}`)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || allHits.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % allHits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + allHits.length) % allHits.length)
    } else if (e.key === 'Enter') {
      const hit = allHits[activeIdx]
      if (hit) {
        e.preventDefault()
        navigate(hit)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const totalHits = allHits.length

  return (
    <div ref={wrapRef} className="search" style={{ position: 'relative' }}>
      <Icon name="search" size={14} />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results && totalHits > 0) setOpen(true)
        }}
        onKeyDown={onKeyDown}
        placeholder="Search cocktails, creators, ingredients…"
        autoComplete="off"
      />
      <span
        className="mono"
        style={{
          fontSize: 10,
          color: 'var(--ink-4)',
          padding: '2px 6px',
          border: '1px solid var(--line-1)',
          borderRadius: 5,
          pointerEvents: 'none',
        }}
      >
        ⌘K
      </span>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--bg-elev)',
            border: '1px solid var(--line-1)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-3, 0 20px 50px rgba(0,0,0,0.18))',
            maxHeight: 480,
            overflowY: 'auto',
            padding: 6,
            zIndex: 50,
          }}
        >
          {loading && (
            <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)', textAlign: 'center' }}>
              Searching…
            </div>
          )}
          {!loading && totalHits === 0 && (
            <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)', textAlign: 'center' }}>
              No matches for <strong>&ldquo;{query}&rdquo;</strong>.
            </div>
          )}
          {!loading && results && results.cocktails.length > 0 && (
            <Section label="Cocktails">
              {results.cocktails.map((hit, i) => (
                <ResultRow
                  key={`c-${hit.id}`}
                  hit={hit}
                  active={i === activeIdx}
                  onActivate={() => setActiveIdx(i)}
                  onChoose={() => navigate(hit)}
                >
                  {hit.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={hit.image_url}
                      alt={hit.title}
                      style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover' }}
                    />
                  ) : (
                    <DrinkOrb
                      from={hit.orb_from ?? '#f4efe0'}
                      to={hit.orb_to ?? '#c9b89a'}
                      size={32}
                    />
                  )}
                </ResultRow>
              ))}
            </Section>
          )}

          {!loading && results && results.creators.length > 0 && (
            <Section label="Creators">
              {results.creators.map((hit, i) => {
                const idx = (results.cocktails.length) + i
                return (
                  <ResultRow
                    key={`cr-${hit.id}`}
                    hit={hit}
                    active={idx === activeIdx}
                    onActivate={() => setActiveIdx(idx)}
                    onChoose={() => navigate(hit)}
                  >
                    <Avatar name={hit.title} size={32} />
                  </ResultRow>
                )
              })}
            </Section>
          )}

          {!loading && results && results.ingredients.length > 0 && (
            <Section label="Ingredients">
              {results.ingredients.map((hit, i) => {
                const idx = results.cocktails.length + results.creators.length + i
                return (
                  <ResultRow
                    key={`i-${hit.source}-${hit.id}`}
                    hit={hit}
                    active={idx === activeIdx}
                    onActivate={() => setActiveIdx(idx)}
                    onChoose={() => navigate(hit)}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        background: 'var(--bg-sunken)',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--ink-4)',
                      }}
                    >
                      <Icon name="leaf" size={14} />
                    </div>
                  </ResultRow>
                )
              })}
            </Section>
          )}

          {!loading && totalHits > 0 && (
            <div
              style={{
                borderTop: '1px solid var(--line-2)',
                marginTop: 4,
                padding: '6px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--ink-4)',
              }}
            >
              <span>↑↓ navigate · ↵ open · esc close</span>
              <Link
                href={`/cocktails?search=${encodeURIComponent(query)}`}
                style={{ color: 'var(--ink-3)' }}
                onClick={() => setOpen(false)}
              >
                See all in library →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        className="mono"
        style={{
          fontSize: 9.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-4)',
          padding: '6px 10px 4px',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function ResultRow({
  hit,
  active,
  onActivate,
  onChoose,
  children,
}: {
  hit: SearchHit
  active: boolean
  onActivate: () => void
  onChoose: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseEnter={onActivate}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onChoose}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        border: 'none',
        background: active ? 'var(--bg-sunken)' : 'transparent',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {children}
      <div className="col" style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 13,
            color: 'var(--ink-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {hit.title}
        </span>
        {hit.subtitle && (
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: 'var(--ink-4)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {hit.subtitle}
          </span>
        )}
      </div>
      <Icon name="chevron-r" size={11} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
    </button>
  )
}
