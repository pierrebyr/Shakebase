'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { DrinkOrb } from './DrinkOrb'
import { GlassIcon } from './GlassIcon'
import { Icon } from '@/components/icons'
import {
  createCollectionWithCocktailAction,
  toggleCollectionMembershipAction,
  toggleFavoriteAction,
} from '@/app/(tenant)/cocktails/card-actions'

export type CocktailCardData = {
  id: string
  slug: string
  name: string
  category: string | null
  spirit_base: string | null
  glass_type: string | null
  orb_from: string | null
  orb_to: string | null
  image_url?: string | null
  creator_name?: string | null
  // When linked to a global_products row, prefer the specific expression
  // (e.g. "Blanco") over the generic spirit family — more useful for
  // brand-owned workspaces.
  base_product_expression?: string | null
  base_product_brand?: string | null
  is_favorite?: boolean
  collection_ids?: string[]
}

export type CollectionOption = {
  id: string
  name: string
  cover_from?: string
  cover_to?: string
  count?: number
  pinned?: boolean
}

export function CocktailCard({
  c,
  allCollections,
  removeFromCollectionId,
}: {
  c: CocktailCardData
  allCollections?: CollectionOption[]
  removeFromCollectionId?: string
}) {
  const from = c.orb_from ?? '#f6efe2'
  const to = c.orb_to ?? '#c9b89a'
  const hasImage = Boolean(c.image_url)
  const spiritLabel = c.base_product_expression ?? c.spirit_base
  const showActions = allCollections !== undefined || removeFromCollectionId !== undefined
  return (
    <Link href={`/cocktails/${c.slug}`} className="card fade-up cocktail-card">
      <div
        className="cocktail-card-thumb"
        style={{
          background: hasImage
            ? '#f4efe6'
            : `radial-gradient(120% 100% at 30% 25%, ${from}, ${to} 75%)`,
        }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image_url ?? ''}
            alt={c.name}
            loading="lazy"
            className="cocktail-card-img"
          />
        ) : (
          <DrinkOrb from={from} to={to} size={160} ring />
        )}
        {showActions && (
          <CardActions
            cocktailId={c.id}
            cocktailName={c.name}
            initialFavorite={c.is_favorite ?? false}
            initialCollectionIds={c.collection_ids ?? []}
            allCollections={allCollections ?? []}
            removeFromCollectionId={removeFromCollectionId}
          />
        )}
        {c.glass_type && (
          <div
            style={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              background: 'var(--bg-glass)',
              border: '1px solid var(--line-1)',
              borderRadius: 999,
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--ink-2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <GlassIcon glass={c.glass_type} size={13} />
            <span>{c.glass_type}</span>
          </div>
        )}
      </div>

      <div className="col" style={{ gap: 6 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 20,
            letterSpacing: '-0.01em',
            color: 'var(--ink-1)',
          }}
        >
          {c.name}
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {c.category && <span className="pill">{c.category}</span>}
          {spiritLabel && (
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {spiritLabel}
            </span>
          )}
        </div>
        {c.creator_name && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>by {c.creator_name}</div>
        )}
      </div>
    </Link>
  )
}

function CardActions({
  cocktailId,
  cocktailName,
  initialFavorite,
  initialCollectionIds,
  allCollections,
  removeFromCollectionId,
}: {
  cocktailId: string
  cocktailName: string
  initialFavorite: boolean
  initialCollectionIds: string[]
  allCollections: CollectionOption[]
  removeFromCollectionId?: string
}) {
  const router = useRouter()
  const [favorite, setFavorite] = useState(initialFavorite)
  const [pulse, setPulse] = useState(false)
  const [memberships, setMemberships] = useState<Set<string>>(
    () => new Set(initialCollectionIds),
  )
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [, startTransition] = useTransition()
  const collectionBtnRef = useRef<HTMLButtonElement>(null)

  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const toggleFav = (e: React.MouseEvent) => {
    stop(e)
    const next = !favorite
    setFavorite(next)
    if (next) {
      setPulse(true)
      setTimeout(() => setPulse(false), 500)
    }
    startTransition(async () => {
      const res = await toggleFavoriteAction(cocktailId)
      if ('error' in res) setFavorite(!next)
      else router.refresh()
    })
  }

  const toggleMembership = (collectionId: string) => {
    const next = new Set(memberships)
    const had = next.has(collectionId)
    if (had) next.delete(collectionId)
    else next.add(collectionId)
    setMemberships(next)
    startTransition(async () => {
      const res = await toggleCollectionMembershipAction(cocktailId, collectionId)
      if ('error' in res) {
        const rollback = new Set(memberships)
        if (had) rollback.add(collectionId)
        else rollback.delete(collectionId)
        setMemberships(rollback)
      } else {
        router.refresh()
      }
    })
  }

  const handleCreate = (name: string, onDone: () => void) => {
    const trimmed = name.trim()
    if (trimmed.length < 2) return
    startTransition(async () => {
      const res = await createCollectionWithCocktailAction(cocktailId, trimmed)
      if ('id' in res) {
        setMemberships(new Set([...memberships, res.id]))
        onDone()
        router.refresh()
      }
    })
  }

  const openCollectionPopover = (e: React.MouseEvent) => {
    stop(e)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setAnchorRect(rect)
  }

  const handleRemove = (e: React.MouseEvent) => {
    stop(e)
    if (!removeFromCollectionId) return
    startTransition(async () => {
      const res = await toggleCollectionMembershipAction(
        cocktailId,
        removeFromCollectionId,
      )
      if (!('error' in res)) router.refresh()
    })
  }

  const inAny = memberships.size > 0

  return (
    <>
      <div
        className="cocktail-card-actions"
        data-open={anchorRect ? 'true' : undefined}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 6,
          zIndex: 2,
        }}
      >
        <button
          type="button"
          onClick={toggleFav}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={favorite}
          style={{
            width: 28,
            height: 28,
            padding: 0,
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            background: favorite ? '#e05858' : 'rgba(255,255,255,0.85)',
            color: favorite ? '#fff' : 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            boxShadow: favorite
              ? '0 2px 8px rgba(224,88,88,0.35)'
              : '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'transform 120ms ease, background 160ms ease, color 160ms ease',
            transform: pulse ? 'scale(1.25)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (!pulse) e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            if (!pulse) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <Icon name={favorite ? 'heart-filled' : 'heart'} size={13} />
        </button>
        {removeFromCollectionId ? (
          <button
            type="button"
            onClick={handleRemove}
            title="Remove from collection"
            aria-label="Remove from collection"
            style={{
              width: 28,
              height: 28,
              padding: 0,
              borderRadius: 999,
              border: '1px solid var(--line-1)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(255,255,255,0.9)',
              color: 'var(--ink-2)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'transform 120ms ease, color 160ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)'
              e.currentTarget.style.color = 'var(--crit)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.color = 'var(--ink-2)'
            }}
          >
            <Icon name="x" size={12} />
          </button>
        ) : (
          <button
            ref={collectionBtnRef}
            type="button"
            onClick={openCollectionPopover}
            title={inAny ? `In ${memberships.size} collection(s)` : 'Add to collection'}
            aria-label="Add to collection"
            aria-expanded={anchorRect !== null}
            style={{
              width: 28,
              height: 28,
              padding: 0,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              background: inAny ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.85)',
              color: inAny ? '#fff' : 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'transform 120ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Icon name={inAny ? 'check' : 'plus'} size={13} />
          </button>
        )}
      </div>

      {anchorRect && (
        <AddToCollectionPopover
          cocktailName={cocktailName}
          anchorRect={anchorRect}
          allCollections={allCollections}
          memberships={memberships}
          onToggle={toggleMembership}
          onCreate={handleCreate}
          onClose={() => setAnchorRect(null)}
        />
      )}
    </>
  )
}

function AddToCollectionPopover({
  cocktailName,
  anchorRect,
  allCollections,
  memberships,
  onToggle,
  onCreate,
  onClose,
}: {
  cocktailName: string
  anchorRect: DOMRect
  allCollections: CollectionOption[]
  memberships: Set<string>
  onToggle: (collectionId: string) => void
  onCreate: (name: string, done: () => void) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const filtered = allCollections.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  )

  const top = anchorRect.bottom + 6
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1280
  const right = Math.max(12, viewportW - anchorRect.right)

  if (!mounted) return null

  return createPortal(
    <>
      <div
        onClick={(e) => {
          stop(e)
          onClose()
        }}
        onMouseDown={stop}
        style={{ position: 'fixed', inset: 0, zIndex: 50 }}
      />
      <div
        onClick={stop}
        onMouseDown={stop}
        className="card"
        style={{
          position: 'fixed',
          top,
          right,
          zIndex: 51,
          width: 300,
          padding: 0,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-3, 0 20px 50px rgba(0,0,0,0.18))',
        }}
      >
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--line-2)' }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: 'var(--ink-4)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Add to collection
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--ink-3)',
              marginBottom: 10,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cocktailName}
          </div>
          <div style={{ position: 'relative' }}>
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search collections…"
              style={{
                width: '100%',
                padding: '7px 10px 7px 28px',
                border: '1px solid var(--line-1)',
                borderRadius: 8,
                fontSize: 12.5,
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
        </div>

        <div style={{ maxHeight: 240, overflowY: 'auto', padding: 4 }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: '14px 12px',
                fontSize: 12,
                color: 'var(--ink-4)',
                textAlign: 'center',
              }}
            >
              {query ? 'No match.' : 'No collections yet.'}
            </div>
          )}
          {filtered.map((col) => {
            const inCol = memberships.has(col.id)
            const swatchFrom = col.cover_from ?? '#f4efe0'
            const swatchTo = col.cover_to ?? '#c9b89a'
            return (
              <button
                key={col.id}
                type="button"
                onClick={(e) => {
                  stop(e)
                  onToggle(col.id)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  gap: 10,
                  fontSize: 12.5,
                  background: inCol ? 'var(--accent-wash)' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--ink-1)',
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1.5px solid ${inCol ? 'var(--accent-ink)' : 'var(--line-1)'}`,
                    background: inCol ? 'var(--accent-ink)' : '#fff',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {inCol && <Icon name="check" size={10} />}
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${swatchFrom}, ${swatchTo})`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.name}
                  </span>
                  {col.pinned && (
                    <Icon
                      name="pin"
                      size={10}
                      style={{ color: 'var(--accent-ink)', flexShrink: 0 }}
                    />
                  )}
                </div>
                {typeof col.count === 'number' && (
                  <span
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--ink-4)', flexShrink: 0 }}
                  >
                    {col.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ borderTop: '1px solid var(--line-2)', padding: 8 }}>
          {creating ? (
            <div className="row gap-sm">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onCreate(newName, () => {
                      setNewName('')
                      setCreating(false)
                    })
                  }
                  if (e.key === 'Escape') setCreating(false)
                }}
                placeholder="Collection name…"
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  border: '1px solid var(--line-1)',
                  borderRadius: 8,
                  fontSize: 12.5,
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={(e) => {
                  stop(e)
                  onCreate(newName, () => {
                    setNewName('')
                    setCreating(false)
                  })
                }}
                style={{ padding: '7px 12px', fontSize: 11.5 }}
                disabled={newName.trim().length < 2}
              >
                Create
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-ghost"
              onClick={(e) => {
                stop(e)
                setCreating(true)
              }}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                fontSize: 12.5,
                padding: '8px 10px',
              }}
            >
              <Icon name="plus" size={12} /> Create new collection…
            </button>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
