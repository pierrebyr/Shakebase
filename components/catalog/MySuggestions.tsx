import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { Icon } from '@/components/icons'

type Row = {
  id: string
  kind: 'product' | 'ingredient'
  name: string
  brand: string | null
  expression: string | null
  status: string
  rejection_reason: string | null
  suggested_at: string
  reviewed_at: string | null
}

function relDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

type Props = { kind: 'product' | 'ingredient' }

export async function MySuggestions({ kind }: Props) {
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const { data } = await supabase
    .from('catalog_suggestions')
    .select(
      'id, kind, name, brand, expression, status, rejection_reason, suggested_at, reviewed_at',
    )
    .eq('suggested_from_workspace_id', workspace.id)
    .eq('kind', kind)
    .order('suggested_at', { ascending: false })
    .limit(10)

  const rows = ((data ?? []) as unknown as Row[])
  if (rows.length === 0) return null

  return (
    <div className="card card-pad" style={{ padding: 22 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="panel-title">Your submissions · {rows.length}</div>
      </div>
      <div className="col" style={{ gap: 0 }}>
        {rows.map((r, i) => {
          const label =
            r.kind === 'product' && r.brand
              ? `${r.brand} — ${r.expression ?? ''}`
              : r.name
          return (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderTop: i > 0 ? '1px solid var(--line-2)' : 'none',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                <div
                  className="mono"
                  style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 2 }}
                >
                  submitted {relDate(r.suggested_at)}
                </div>
                {r.rejection_reason && (
                  <div
                    style={{ fontSize: 11.5, color: 'var(--crit)', marginTop: 2 }}
                  >
                    rejected: {r.rejection_reason}
                  </div>
                )}
              </div>
              <StatusPill status={r.status} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string; icon?: boolean }> = {
    pending: { label: 'Pending', bg: 'var(--bg-sunken)', color: 'var(--ink-3)' },
    approved: { label: 'Approved', bg: '#e3f0e9', color: 'var(--ok)', icon: true },
    merged: {
      label: 'Merged',
      bg: 'rgba(127,174,207,0.12)',
      color: '#2f5e7a',
    },
    rejected: {
      label: 'Rejected',
      bg: 'rgba(224,114,100,0.1)',
      color: 'var(--crit)',
    },
  }
  const m = map[status] ?? map.pending!
  return (
    <span
      className="pill"
      style={{
        background: m.bg,
        color: m.color,
        borderColor: 'transparent',
        fontSize: 10.5,
      }}
    >
      {m.icon && <Icon name="check" size={10} />}
      {m.label}
    </span>
  )
}
