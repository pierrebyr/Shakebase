'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/icons'
import { CreatorCard, type CreatorCardData } from './CreatorCard'
import { EmptyState } from '@/components/EmptyState'

export function CreatorsFilterBar({ creators }: { creators: CreatorCardData[] }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<string>('All')

  const roles = useMemo(() => {
    const set = new Set<string>()
    creators.forEach((c) => c.role && set.add(c.role))
    return ['All', ...Array.from(set).sort()]
  }, [creators])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return creators.filter((cr) => {
      if (filter !== 'All' && cr.role !== filter) return false
      if (!needle) return true
      const hay = [
        cr.name,
        cr.role,
        cr.venue,
        cr.city,
        cr.country,
        cr.signature,
        ...(cr.specialties ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(needle)
    })
  }, [creators, q, filter])

  if (creators.length === 0) {
    return (
      <EmptyState
        kicker="No creators yet"
        title="Give credit where it's due."
        description="Add the bartenders, mixologists, and guest contributors who author your cocktails."
        ctaLabel="Add a creator"
        ctaHref="/creators/new"
      />
    )
  }

  return (
    <>
      <div
        className="card"
        style={{
          padding: '10px 14px',
          marginBottom: 22,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 220px',
            minWidth: 200,
            maxWidth: 360,
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
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, venue, specialty…"
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
        <label
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '7px 28px 7px 12px',
            borderRadius: 999,
            border: '1px solid var(--line-1)',
            background: filter !== 'All' ? 'var(--accent-wash)' : '#fff',
            color: filter !== 'All' ? 'var(--accent-ink)' : 'var(--ink-2)',
            fontSize: 12,
            fontWeight: filter !== 'All' ? 500 : 400,
            cursor: 'pointer',
          }}
        >
          <span style={{ userSelect: 'none' }}>Role: {filter}</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
            }}
            aria-label="Filter by role"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
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
        {filtered.length !== creators.length && (
          <span
            className="mono"
            style={{ fontSize: 11, color: 'var(--ink-4)', marginLeft: 'auto' }}
          >
            {filtered.length} / {creators.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="card card-pad"
          style={{ textAlign: 'center', padding: 40, color: 'var(--ink-3)' }}
        >
          No match. Try a different search.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--density-gap)',
          }}
        >
          {filtered.map((cr) => (
            <CreatorCard key={cr.id} cr={cr} />
          ))}
        </div>
      )}
    </>
  )
}
