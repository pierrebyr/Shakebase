'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { OpIcon } from '@/components/admin/Icon'

type Props = {
  defaultQuery: string
  currentKind: string
  resultCount: number
}

export function AuditFilters({ defaultQuery, currentKind, resultCount }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(defaultQuery)
  const [, startTransition] = useTransition()

  function submit(next: string) {
    const params = new URLSearchParams()
    if (currentKind !== 'all') params.set('kind', currentKind)
    if (next) params.set('q', next)
    startTransition(() => {
      router.push('/admin/audit' + (params.toString() ? '?' + params.toString() : ''))
    })
  }

  return (
    <div className="op-filter-bar">
      <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 480 }}>
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
          placeholder="Search action, target, actor…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => submit(q)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit(q)
          }}
        />
      </div>
      <span className="mut mono" style={{ fontSize: 11, marginLeft: 'auto' }}>
        {resultCount} events
      </span>
    </div>
  )
}
