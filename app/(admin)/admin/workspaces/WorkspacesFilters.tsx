'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { OpIcon } from '@/components/admin/Icon'

type Props = {
  defaultQuery: string
  defaultSort: string
  resultCount: number
}

export function WorkspacesFilters({ defaultQuery, defaultSort, resultCount }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = useState(defaultQuery)
  const [, startTransition] = useTransition()

  function update(next: { q?: string; sort?: string }) {
    const params = new URLSearchParams(sp?.toString() ?? '')
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q)
      else params.delete('q')
    }
    if (next.sort !== undefined) {
      if (next.sort && next.sort !== 'active') params.set('sort', next.sort)
      else params.delete('sort')
    }
    startTransition(() => {
      router.push('/admin/workspaces' + (params.toString() ? '?' + params.toString() : ''))
    })
  }

  return (
    <div className="op-filter-bar">
      <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 400 }}>
        <span
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--op-ink-4)',
          }}
        >
          <OpIcon name="search" size={13} />
        </span>
        <input
          className="op-input"
          style={{ width: '100%', paddingLeft: 30 }}
          placeholder="Search name, slug, owner email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => update({ q })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update({ q })
          }}
        />
      </div>
      <select
        className="op-input op-select"
        defaultValue={defaultSort}
        onChange={(e) => update({ sort: e.target.value })}
      >
        <option value="active">Last active</option>
        <option value="created">Newest</option>
        <option value="members">Most members</option>
        <option value="cocktails">Most cocktails</option>
      </select>
      <span className="mut mono" style={{ fontSize: 11, marginLeft: 'auto' }}>
        {resultCount} results
      </span>
    </div>
  )
}
