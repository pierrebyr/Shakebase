import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import { timeAgo, fmtDate } from '@/lib/admin/format'
import { SuggestionRow } from './SuggestionRow'

type Suggestion = {
  id: string
  kind: 'product' | 'ingredient'
  name: string
  category: string | null
  note: string | null
  brand: string | null
  expression: string | null
  abv: number | null
  origin: string | null
  description: string | null
  default_unit: string | null
  status: string
  suggested_by_user_id: string | null
  suggested_from_workspace_id: string | null
  suggested_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  canonical_id: string | null
}

type Dupe = { id: string; label: string; kind: 'product' | 'ingredient' }

type Params = { searchParams: Promise<{ tab?: string; action?: string; reason?: string }> }

const TAB_STATUS: Record<string, string[]> = {
  pending: ['pending'],
  recent: ['approved', 'merged'],
  rejected: ['rejected'],
}

export default async function AdminCatalogPage({ searchParams }: Params) {
  const sp = await searchParams
  const tab = sp.tab && TAB_STATUS[sp.tab] ? sp.tab : 'pending'
  const admin = createAdminClient()

  const [
    { count: productCount },
    { count: ingredientCount },
    { count: pendingCount },
    { count: approvedWeekCount },
    { count: rejectedCount },
    { data: suggestions },
  ] = await Promise.all([
    admin.from('global_products').select('id', { count: 'exact', head: true }),
    admin.from('global_ingredients').select('id', { count: 'exact', head: true }),
    admin
      .from('catalog_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    admin
      .from('catalog_suggestions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['approved', 'merged'])
      .gte('reviewed_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    admin
      .from('catalog_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected'),
    admin
      .from('catalog_suggestions')
      .select(
        'id, kind, name, category, note, brand, expression, abv, origin, description, default_unit, status, suggested_by_user_id, suggested_from_workspace_id, suggested_at, reviewed_by, reviewed_at, rejection_reason, canonical_id',
      )
      .in('status', TAB_STATUS[tab] ?? ['pending'])
      .order(tab === 'pending' ? 'suggested_at' : 'reviewed_at', {
        ascending: tab === 'pending',
      })
      .limit(100),
  ])

  const rows = ((suggestions ?? []) as unknown as Suggestion[])

  // Dupe detection: for every pending suggestion, find canonical rows whose
  // name/brand matches via case-insensitive substring. Batched here to avoid
  // N queries.
  const productSugs = rows.filter((r) => r.kind === 'product')
  const ingredientSugs = rows.filter((r) => r.kind === 'ingredient')

  const dupeMap = new Map<string, Dupe[]>()

  if (productSugs.length > 0) {
    const queries = productSugs.flatMap((s) => {
      const out: string[] = []
      if (s.name) out.push(s.name)
      if (s.brand) out.push(s.brand)
      if (s.expression) out.push(s.expression)
      return out
    })
    if (queries.length > 0) {
      const pattern = queries.map((q) => `brand.ilike.%${q}%,expression.ilike.%${q}%`).join(',')
      const { data: gp } = await admin
        .from('global_products')
        .select('id, brand, expression')
        .or(pattern)
        .limit(200)
      const canonProducts = (gp ?? []) as { id: string; brand: string; expression: string }[]
      for (const s of productSugs) {
        const matches = canonProducts.filter((c) => {
          const hay = `${c.brand} ${c.expression}`.toLowerCase()
          const parts = [s.name, s.brand, s.expression].filter(Boolean).map((p) => p!.toLowerCase())
          return parts.some((p) => hay.includes(p) || p.includes(c.brand.toLowerCase()))
        })
        if (matches.length > 0) {
          dupeMap.set(
            s.id,
            matches.slice(0, 3).map((m) => ({
              id: m.id,
              label: `${m.brand} — ${m.expression}`,
              kind: 'product' as const,
            })),
          )
        }
      }
    }
  }

  if (ingredientSugs.length > 0) {
    const names = ingredientSugs.map((s) => s.name).filter(Boolean)
    if (names.length > 0) {
      const pattern = names.map((n) => `name.ilike.%${n}%`).join(',')
      const { data: gi } = await admin
        .from('global_ingredients')
        .select('id, name')
        .or(pattern)
        .limit(200)
      const canon = (gi ?? []) as { id: string; name: string }[]
      for (const s of ingredientSugs) {
        const matches = canon.filter((c) =>
          c.name.toLowerCase().includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(c.name.toLowerCase()),
        )
        if (matches.length > 0) {
          dupeMap.set(
            s.id,
            matches.slice(0, 3).map((m) => ({
              id: m.id,
              label: m.name,
              kind: 'ingredient' as const,
            })),
          )
        }
      }
    }
  }

  // Resolve submitter emails + workspace names
  const userIds = rows.map((r) => r.suggested_by_user_id).filter((x): x is string => Boolean(x))
  const wsIds = rows
    .map((r) => r.suggested_from_workspace_id)
    .filter((x): x is string => Boolean(x))
  const userMap = new Map<string, string | null>()
  if (userIds.length > 0) {
    const { data: userList } = await admin.auth.admin.listUsers({ perPage: 500 })
    for (const u of userList.users) userMap.set(u.id, u.email ?? null)
  }
  const { data: wsRows } = wsIds.length > 0
    ? await admin.from('workspaces').select('id, name, slug').in('id', wsIds)
    : { data: [] as { id: string; name: string; slug: string }[] }
  const wsMap = new Map(
    ((wsRows ?? []) as { id: string; name: string; slug: string }[]).map((w) => [
      w.id,
      { name: w.name, slug: w.slug },
    ]),
  )

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Moderation queue
          </div>
          <h1 className="op-title">
            Global <span className="it">catalog.</span>
          </h1>
          <p className="op-sub">
            Workspaces suggest products and ingredients. Approve, merge — or reject. Without this,
            the shared library drifts fast.
          </p>
        </div>
      </div>

      {sp.action && <ActionToast action={sp.action} reason={sp.reason} />}

      <div
        className="op-stats"
        style={{ marginBottom: 18, gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        <div className="op-stat">
          <div className="k">Pending</div>
          <div className="v">{pendingCount ?? 0}</div>
          {(pendingCount ?? 0) > 0 && (
            <div className="d warn">
              <OpIcon name="warning" size={11} />
              Queue requires review
            </div>
          )}
        </div>
        <div className="op-stat">
          <div className="k">Approved this week</div>
          <div className="v">{approvedWeekCount ?? 0}</div>
        </div>
        <div className="op-stat">
          <div className="k">Canonical products</div>
          <div className="v">{(productCount ?? 0).toLocaleString()}</div>
        </div>
        <div className="op-stat">
          <div className="k">Canonical ingredients</div>
          <div className="v">{(ingredientCount ?? 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="op-tabs">
        {[
          { id: 'pending', label: 'Pending', count: pendingCount ?? 0 },
          { id: 'recent', label: 'Recently approved', count: approvedWeekCount ?? 0 },
          { id: 'rejected', label: 'Rejected', count: rejectedCount ?? 0 },
        ].map((t) => (
          <a
            key={t.id}
            href={`/admin/catalog${t.id === 'pending' ? '' : '?tab=' + t.id}`}
            className="op-tab"
            data-active={tab === t.id}
          >
            {t.label}
            <span className="count">{t.count}</span>
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="op-card">
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
              <OpIcon name="catalog" size={22} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
              {tab === 'pending'
                ? 'Moderation queue is empty.'
                : tab === 'recent'
                  ? 'No recent approvals.'
                  : 'Nothing rejected.'}
            </div>
            <p
              className="mut"
              style={{ fontSize: 13, margin: '0 auto', maxWidth: '50ch', lineHeight: 1.55 }}
            >
              {tab === 'pending'
                ? 'When workspaces submit products or ingredients via the tenant app, they land here.'
                : 'Review history will accumulate as you work through submissions.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="op-card" style={{ padding: 0 }}>
          {rows.map((r) => {
            const email = r.suggested_by_user_id ? userMap.get(r.suggested_by_user_id) : null
            const ws = r.suggested_from_workspace_id
              ? wsMap.get(r.suggested_from_workspace_id)
              : null
            return (
              <SuggestionRow
                key={r.id}
                s={r}
                submitterEmail={email ?? null}
                workspaceName={ws?.name ?? null}
                dupes={dupeMap.get(r.id) ?? []}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

const ACTION_SUCCESS: Record<string, string> = {
  approve_ok: 'Suggestion approved and added to the canonical catalog.',
  reject_ok: 'Suggestion rejected. Submitter will see the reason if they look.',
  merge_ok: 'Suggestion merged into existing canonical entry.',
}

const ACTION_ERROR: Record<string, string> = {
  not_pending: 'This suggestion has already been reviewed.',
  missing_product_fields: 'Product is missing brand, expression, or category.',
  missing_name: 'Suggestion has no name.',
  missing_target: 'Pick a canonical entry to merge into first.',
  target_not_found: 'Merge target no longer exists.',
  duplicate_product: 'A product with that brand + expression already exists.',
  duplicate_ingredient: 'An ingredient with that name already exists.',
  insert_failed: 'Database insert failed. Check logs.',
  update_failed: 'Database update failed. Check logs.',
  unknown_op: 'Unknown action.',
}

function ActionToast({ action, reason }: { action: string; reason?: string }) {
  const ok = action.endsWith('_ok')
  const bg = ok ? 'rgba(95,181,138,0.08)' : 'rgba(224,114,100,0.08)'
  const border = ok ? 'rgba(95,181,138,0.25)' : 'rgba(224,114,100,0.25)'
  const tone = ok ? 'var(--op-ok)' : 'var(--op-crit)'
  const msg = ok
    ? (ACTION_SUCCESS[action] ?? 'Done.')
    : (ACTION_ERROR[reason ?? ''] ?? `Action failed (${reason ?? action}).`)
  return (
    <div
      className="op-card"
      style={{
        padding: 14,
        marginBottom: 14,
        background: bg,
        border: '1px solid ' + border,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <OpIcon name={ok ? 'check' : 'warning'} size={16} style={{ color: tone }} />
      <div style={{ fontSize: 12.5 }}>
        <b style={{ fontWeight: 500 }}>{msg}</b>
      </div>
    </div>
  )
}

// Referenced for type completeness but not rendered directly.
export const _unused = { timeAgo, fmtDate }
