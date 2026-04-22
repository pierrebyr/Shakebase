import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import { fmtDateTime, timeAgo } from '@/lib/admin/format'
import { AuditFilters } from './AuditFilters'

type AuditRow = {
  id: string
  at: string
  actor_kind: string
  actor_user_id: string | null
  actor_email: string | null
  impersonating_admin_id: string | null
  action: string
  target_kind: string | null
  target_id: string | null
  target_label: string | null
  workspace_id: string | null
  meta: Record<string, unknown>
}

type Params = { searchParams: Promise<{ kind?: string; q?: string }> }

const ACTOR_TONE: Record<string, string> = {
  admin: 'accent',
  impersonation: 'warn',
  user: '',
  system: 'info',
}

const ACTOR_LABEL: Record<string, string> = {
  admin: 'ADMIN',
  impersonation: 'IMPERS',
  user: 'USER',
  system: 'SYSTEM',
}

export default async function AdminAuditPage({ searchParams }: Params) {
  const sp = await searchParams
  const kind = sp.kind ?? 'all'
  const q = (sp.q ?? '').trim().toLowerCase()

  const admin = createAdminClient()
  let query = admin
    .from('audit_events')
    .select(
      'id, at, actor_kind, actor_user_id, actor_email, impersonating_admin_id, action, target_kind, target_id, target_label, workspace_id, meta',
    )
    .order('at', { ascending: false })
    .limit(200)
  if (kind !== 'all') query = query.eq('actor_kind', kind)

  const { data } = await query
  let rows = ((data ?? []) as unknown as AuditRow[])

  // Union with legacy audit_logs rows — older actions (cocktail/product/team
  // writes from before audit_events existed) still land there. Normalise to
  // the audit_events shape so downstream rendering is identical.
  if (kind === 'all' || kind === 'user') {
    const { data: legacy } = await admin
      .from('audit_logs')
      .select('id, workspace_id, actor_user_id, action, target_type, target_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    const legacyRows = ((legacy ?? []) as unknown as {
      id: string
      workspace_id: string | null
      actor_user_id: string | null
      action: string
      target_type: string | null
      target_id: string | null
      metadata: Record<string, unknown> | null
      created_at: string
    }[]).map((r) => ({
      id: `legacy:${r.id}`,
      at: r.created_at,
      actor_kind: 'user',
      actor_user_id: r.actor_user_id,
      actor_email: null,
      impersonating_admin_id: null,
      action: r.action,
      target_kind: r.target_type,
      target_id: r.target_id,
      target_label: (r.metadata?.name as string) ?? (r.metadata?.slug as string) ?? null,
      workspace_id: r.workspace_id,
      meta: r.metadata ?? {},
    })) satisfies AuditRow[]
    rows = [...rows, ...legacyRows].sort((a, b) => b.at.localeCompare(a.at))
  }

  rows = rows.filter((a) => {
    if (!q) return true
    return (
      a.action.toLowerCase().includes(q) ||
      (a.target_label ?? '').toLowerCase().includes(q) ||
      (a.actor_email ?? '').toLowerCase().includes(q)
    )
  })

  // Tab counts — one tiny query per kind so numbers reflect totals, not the filtered view.
  const counts = await Promise.all(
    (['all', 'admin', 'impersonation', 'user', 'system'] as const).map(async (k) => {
      let q2 = admin.from('audit_events').select('id', { count: 'exact', head: true })
      if (k !== 'all') q2 = q2.eq('actor_kind', k)
      const { count } = await q2
      return count ?? 0
    }),
  )
  const [allCount = 0, adminCount = 0, imperCount = 0, userCount = 0, systemCount = 0] = counts

  const tabs: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allCount },
    { id: 'admin', label: 'Admin', count: adminCount },
    { id: 'impersonation', label: 'Impersonation', count: imperCount },
    { id: 'user', label: 'User', count: userCount },
    { id: 'system', label: 'System', count: systemCount },
  ]

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Trust &amp; debug
          </div>
          <h1 className="op-title">Audit log</h1>
          <p className="op-sub">
            Every meaningful platform event — who did what, when. Impersonation attempts are
            tagged so the real actor is always on record.
          </p>
        </div>
      </div>

      <div className="op-tabs">
        {tabs.map((t) => {
          const params = new URLSearchParams()
          if (t.id !== 'all') params.set('kind', t.id)
          if (q) params.set('q', q)
          const href =
            '/admin/audit' + (params.toString() ? '?' + params.toString() : '')
          return (
            <a key={t.id} href={href} className="op-tab" data-active={kind === t.id}>
              {t.label}
              <span className="count">{t.count}</span>
            </a>
          )
        })}
      </div>

      <AuditFilters defaultQuery={q} currentKind={kind} resultCount={rows.length} />

      <div className="op-card" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--op-surface-2)',
                color: 'var(--op-ink-3)',
                marginBottom: 14,
              }}
            >
              <OpIcon name="audit" size={22} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
              {allCount === 0 ? 'No events recorded yet.' : 'No events match these filters.'}
            </div>
            <p
              className="mut"
              style={{ fontSize: 13, margin: '0 auto', maxWidth: '50ch', lineHeight: 1.55 }}
            >
              {allCount === 0
                ? 'Admin actions, impersonation attempts, and billing changes will stream here as they happen.'
                : 'Try clearing the search or switching tabs.'}
            </p>
          </div>
        ) : (
          <div className="op-t-wrap">
            <table className="op-t">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const tone = ACTOR_TONE[a.actor_kind] ?? ''
                  const label = ACTOR_LABEL[a.actor_kind] ?? a.actor_kind.toUpperCase()
                  const metaLine = formatMeta(a.meta)
                  return (
                    <tr key={a.id}>
                      <td className="mut mono nowrap" style={{ fontSize: 11 }}>
                        <div>{fmtDateTime(a.at)}</div>
                        <div style={{ color: 'var(--op-ink-4)', marginTop: 2 }}>
                          {timeAgo(a.at)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={'op-chip ' + tone} style={{ fontSize: 9.5 }}>
                            {label}
                          </span>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 12.5 }}>
                              {a.actor_email ?? a.actor_user_id?.slice(0, 8) ?? '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="mono" style={{ fontSize: 11.5 }}>
                        {a.action}
                      </td>
                      <td>
                        {a.target_label && (
                          <div style={{ fontWeight: 500, fontSize: 12.5 }}>{a.target_label}</div>
                        )}
                        {a.target_id && (
                          <div className="mut mono" style={{ fontSize: 10.5 }}>
                            {a.target_id}
                          </div>
                        )}
                      </td>
                      <td className="mut" style={{ fontSize: 12, maxWidth: 360 }}>
                        {metaLine || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatMeta(meta: Record<string, unknown>): string | null {
  if (!meta || Object.keys(meta).length === 0) return null
  const pairs: string[] = []
  for (const [k, v] of Object.entries(meta)) {
    if (v == null) continue
    const val = typeof v === 'string' ? v : JSON.stringify(v)
    pairs.push(`${k}: ${val}`)
  }
  return pairs.length > 0 ? pairs.join(' · ') : null
}
