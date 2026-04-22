'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icons'

type Notification = {
  id: string
  kind: string
  title: string
  body: string | null
  url: string | null
  actor_label: string | null
  read_at: string | null
  created_at: string
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

async function fetchInbox(): Promise<{ items: Notification[]; unread: number }> {
  const res = await fetch('/api/notifications', { cache: 'no-store' })
  if (!res.ok) return { items: [], unread: 0 }
  return (await res.json()) as { items: Notification[]; unread: number }
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  const refresh = async () => {
    const data = await fetchInbox()
    setItems(data.items)
    setUnread(data.unread)
    setLoaded(true)
  }

  useEffect(() => {
    void refresh()
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function markAllRead() {
    await fetch('/api/notifications/read', { method: 'POST', body: '{}' })
    await refresh()
  }

  async function handleClick(n: Notification) {
    if (!n.read_at) {
      await fetch('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ ids: [n.id] }),
        headers: { 'Content-Type': 'application/json' },
      })
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, read_at: new Date().toISOString() } : p)))
      setUnread((u) => Math.max(0, u - 1))
    }
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        style={{ position: 'relative', overflow: 'visible' }}
      >
        <Icon name="bell" size={15} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 14,
              height: 14,
              padding: '0 3px',
              borderRadius: 999,
              background: 'var(--crit)',
              color: '#fff',
              fontSize: 9.5,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              letterSpacing: 0,
              boxShadow: '0 0 0 2px #fff',
              pointerEvents: 'none',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 380,
            maxHeight: 480,
            overflow: 'auto',
            background: '#fff',
            border: '1px solid var(--line-1)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-3)',
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--line-2)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 18,
                letterSpacing: '-0.01em',
              }}
            >
              Inbox
            </div>
            {unread > 0 && (
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {!loaded && (
            <div
              style={{ padding: 24, textAlign: 'center', color: 'var(--ink-4)', fontSize: 12.5 }}
            >
              Loading…
            </div>
          )}

          {loaded && items.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-grid',
                  placeItems: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--bg-sunken)',
                  color: 'var(--ink-3)',
                  marginBottom: 10,
                }}
              >
                <Icon name="bell" size={18} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                You&rsquo;re all caught up.
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                Team changes and activity will show up here.
              </div>
            </div>
          )}

          {loaded &&
            items.map((n) => {
              const inner = (
                <div
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--line-2)',
                    cursor: 'pointer',
                    background: n.read_at ? '#fff' : 'var(--accent-wash)',
                    transition: 'background 120ms',
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: n.read_at ? 'transparent' : 'var(--accent)',
                      marginTop: 7,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--ink-3)',
                          lineHeight: 1.5,
                          marginBottom: 4,
                        }}
                      >
                        {n.body}
                      </div>
                    )}
                    <div
                      className="mono"
                      style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '0.06em' }}
                    >
                      {relTime(n.created_at)}
                    </div>
                  </div>
                </div>
              )
              return n.url ? (
                <Link key={n.id} href={n.url} style={{ color: 'inherit' }}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              )
            })}

          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--line-2)',
              textAlign: 'center',
              background: 'var(--bg-sunken)',
            }}
          >
            <Link
              href="/settings/notifications"
              onClick={() => setOpen(false)}
              style={{
                fontSize: 12,
                color: 'var(--ink-3)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Notification preferences →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
