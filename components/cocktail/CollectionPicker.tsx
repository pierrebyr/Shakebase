'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Icon } from '@/components/icons'
import { setCollectionMembershipsAction } from '@/app/(tenant)/collections/[id]/actions'

type Collection = {
  id: string
  name: string
  cover_from: string
  cover_to: string
}

type Props = {
  cocktailId: string
  allCollections: Collection[]
  memberIds: string[]
}

export function CollectionPicker({ cocktailId, allCollections, memberIds }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(memberIds))
  const [pending, startTransition] = useTransition()
  const [dirty, setDirty] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setDirty(true)
  }

  function save() {
    startTransition(async () => {
      await setCollectionMembershipsAction(cocktailId, [...selected])
      setDirty(false)
      setOpen(false)
    })
  }

  const activeCount = selected.size

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bookmark" size={13} />
        {activeCount > 0 ? `In ${activeCount} collection${activeCount === 1 ? '' : 's'}` : 'Save to collection'}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 320,
            maxHeight: 420,
            overflow: 'auto',
            background: '#fff',
            border: '1px solid var(--line-1)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-3)',
            padding: 14,
            zIndex: 30,
          }}
        >
          <div
            className="row"
            style={{ justifyContent: 'space-between', marginBottom: 10 }}
          >
            <span
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-4)',
              }}
            >
              Save to
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ color: 'var(--ink-4)' }}
            >
              <Icon name="x" size={13} />
            </button>
          </div>

          {allCollections.length === 0 ? (
            <div style={{ padding: 16, color: 'var(--ink-4)', fontSize: 12.5, textAlign: 'center' }}>
              No collections yet.{' '}
              <a
                href="/collections/new"
                style={{ color: 'var(--accent-ink)', fontWeight: 500 }}
              >
                Create one →
              </a>
            </div>
          ) : (
            <div className="col" style={{ gap: 2 }}>
              {allCollections.map((c) => {
                const isOn = selected.has(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 1fr 18px',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: isOn ? 'var(--accent-wash)' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      alignItems: 'center',
                      transition: 'background 100ms',
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 20,
                        borderRadius: 6,
                        background: `radial-gradient(120% 100% at 30% 25%, ${c.cover_from}, ${c.cover_to} 80%)`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--ink-1)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        background: isOn ? 'var(--ink-1)' : 'transparent',
                        border: isOn ? 'none' : '1.5px solid var(--line-1)',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#fff',
                      }}
                    >
                      {isOn && <Icon name="check" size={10} />}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div
            style={{
              borderTop: '1px solid var(--line-2)',
              marginTop: 10,
              paddingTop: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <a
              href="/collections/new"
              className="btn-ghost"
              style={{ fontSize: 11.5 }}
            >
              <Icon name="plus" size={11} />
              New collection
            </a>
            <button
              type="button"
              className="btn-primary"
              onClick={save}
              disabled={!dirty || pending}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                opacity: dirty ? 1 : 0.6,
              }}
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
