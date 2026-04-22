'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Icon } from '@/components/icons'
import { CollectionCover } from './CollectionCover'
import { deleteCollectionFromListAction } from '@/app/(tenant)/collections/list-actions'
import { relTime } from '@/lib/datetime'

export type CollectionCardData = {
  id: string
  name: string
  description: string | null
  cover_from: string
  cover_to: string
  pinned: boolean
  updated_at: string
  owner_name: string | null
  count: number
  orbs: { from: string; to: string }[]
}

export function CollectionCard({ c }: { c: CollectionCardData }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete the "${c.name}" collection? The cocktails inside stay in the library.`)) {
      return
    }
    startTransition(async () => {
      const res = await deleteCollectionFromListAction(c.id)
      if ('error' in res) {
        alert(`Delete failed: ${res.error}`)
        return
      }
      router.refresh()
    })
  }

  return (
    <Link
      href={`/collections/${c.id}`}
      className="collection-card card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <CollectionCover from={c.cover_from} to={c.cover_to} orbs={c.orbs} height={170} />

      <button
        type="button"
        className="collection-card-del"
        onClick={handleDelete}
        title="Delete collection"
        aria-label="Delete collection"
        disabled={pending}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          padding: 0,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255,255,255,0.9)',
          color: 'var(--crit)',
          border: '1px solid var(--line-1)',
          borderRadius: 999,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          cursor: pending ? 'wait' : 'pointer',
          zIndex: 2,
        }}
      >
        <Icon name="x" size={12} />
      </button>

      <div
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
        }}
      >
        <div className="row gap-sm" style={{ alignItems: 'center' }}>
          {c.pinned ? (
            <span
              className="mono"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 9.5,
                color: 'var(--accent-ink)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              <Icon name="pin" size={9} /> Pinned
            </span>
          ) : (
            <span
              className="mono"
              style={{
                fontSize: 9.5,
                color: 'var(--ink-4)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Collection
            </span>
          )}
          <span
            className="mono"
            style={{
              fontSize: 9.5,
              color: 'var(--ink-4)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            · {c.count} cocktail{c.count === 1 ? '' : 's'}
          </span>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            color: 'var(--ink-1)',
          }}
        >
          {c.name}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            color: 'var(--ink-3)',
            lineHeight: 1.5,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {c.description || 'No description yet.'}
        </p>

        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTop: '1px solid var(--line-2)',
          }}
        >
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
            {c.owner_name ?? 'Workspace'}
          </span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
            Updated {relTime(c.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}
