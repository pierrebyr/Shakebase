'use client'

import { useEffect, useRef, useState } from 'react'
import {
  searchIngredientsAction,
  type IngredientHit,
} from '@/app/(tenant)/cocktails/[id]/edit/ingredient-autocomplete-actions'

export type SelectedIngredient = {
  kind: 'global' | 'workspace'
  id: string
  name: string
}

type Props = {
  value: string
  onChange: (name: string) => void
  onSelect?: (selected: SelectedIngredient | null) => void
  placeholder?: string
  style?: React.CSSProperties
  className?: string
}

export function IngredientNameInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Ingredient',
  style,
  className,
}: Props) {
  const [hits, setHits] = useState<IngredientHit[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [focused, setFocused] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search — only fetch while the input is focused
  useEffect(() => {
    if (!focused) return
    const q = value.trim()
    if (q.length < 1) {
      setHits([])
      setOpen(false)
      return
    }
    const t = setTimeout(async () => {
      const results = await searchIngredientsAction(q, 8)
      setHits(results)
      setActiveIdx(0)
      setOpen(true)
    }, 120)
    return () => clearTimeout(t)
  }, [value, focused])

  // Click-outside closes
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const choose = (h: IngredientHit) => {
    onChange(h.name)
    onSelect?.({ kind: h.kind, id: h.id, name: h.name })
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || hits.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter') {
      const hit = hits[activeIdx]
      if (hit) {
        e.preventDefault()
        choose(hit)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', minWidth: 0 }} className={className}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          // Typing invalidates any previous selection
          onSelect?.(null)
        }}
        onFocus={() => {
          setFocused(true)
          if (hits.length > 0) setOpen(true)
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={style}
      />
      {open && hits.length > 0 && (
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
            maxHeight: 240,
            overflowY: 'auto',
            padding: 4,
            zIndex: 30,
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
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
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
        </div>
      )}
    </div>
  )
}
