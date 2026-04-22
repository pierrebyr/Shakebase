const WS_PALETTE = [
  '#c49155',
  '#5a7d62',
  '#2f5e7a',
  '#8c5a7f',
  '#a75a4f',
  '#3a4050',
  '#6a5f3b',
  '#4a6858',
]

export function wsColor(slug: string): string {
  let h = 0
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return WS_PALETTE[h % WS_PALETTE.length]!
}

export function wsGlyph(name: string): string {
  const first = name.trim().charAt(0)
  return first ? first.toUpperCase() : 'W'
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function dollars(cents: number | null | undefined): string {
  if (cents == null) return '$0'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export type WorkspaceStatus =
  | 'pending_payment'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'frozen'

export function statusLabel(s: WorkspaceStatus | string): string {
  if (s === 'trialing') return 'Trial'
  if (s === 'past_due') return 'Past due'
  if (s === 'pending_payment') return 'Pending'
  if (s === 'canceled') return 'Cancelled'
  if (s === 'frozen') return 'Frozen'
  if (s === 'active') return 'Active'
  return s
}

export function statusTone(s: WorkspaceStatus | string): 'ok' | 'warn' | 'crit' | 'info' | '' {
  if (s === 'active') return 'ok'
  if (s === 'trialing') return 'warn'
  if (s === 'past_due') return 'crit'
  if (s === 'frozen') return 'crit'
  if (s === 'pending_payment') return 'info'
  return ''
}
