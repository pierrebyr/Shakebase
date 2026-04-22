'use client'

import { useState, useTransition } from 'react'
import { togglePricingEnabledAction } from './actions'

export function PricingToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const toggle = () => {
    setErr(null)
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const res = await togglePricingEnabledAction(next)
      if ('error' in res && res.error) {
        setEnabled(!next) // rollback
        setErr(res.error)
      }
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 20,
        padding: '14px 0',
        borderBottom: '1px solid var(--line-2)',
      }}
    >
      <div className="col" style={{ gap: 4, flex: 1 }}>
        <span style={{ fontSize: 13.5, fontWeight: 500 }}>
          Pricing &amp; margin UI
        </span>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          Show menu prices, bottle costs, and margin analytics across the dashboard.
          Turn off for library-only workspaces (brand catalog, spec archive…).
        </span>
        {err && (
          <span style={{ fontSize: 11.5, color: 'var(--crit)' }}>{err}</span>
        )}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        role="switch"
        aria-checked={enabled}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: 'none',
          padding: 2,
          background: enabled ? 'var(--accent)' : 'var(--line-1)',
          cursor: pending ? 'wait' : 'pointer',
          transition: 'background 160ms',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'block',
            width: 20,
            height: 20,
            borderRadius: 999,
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transform: enabled ? 'translateX(20px)' : 'translateX(0)',
            transition: 'transform 160ms',
          }}
        />
      </button>
    </div>
  )
}
