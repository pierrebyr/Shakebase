import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import { timeAgo } from '@/lib/admin/format'
import { SuggestionRow } from './SuggestionRow'

type TabId = 'products' | 'ingredients' | 'suggestions'

type SearchParams = {
  tab?: string
  q?: string
  cat?: string
  sub?: string
  sort?: string
  unused?: string
  incomplete?: string
  action?: string
  reason?: string
}

type SortKey = 'name' | 'name_desc' | 'used' | 'used_desc'

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

type GlobalProduct = {
  id: string
  brand: string
  expression: string
  category: string | null
  abv: number | null
  origin: string | null
  tagline: string | null
  image_url: string | null
  created_at: string | null
}

type GlobalIngredient = {
  id: string
  name: string
  category: string | null
  default_unit: string | null
  created_at: string | null
}

const SUB_STATUS: Record<string, string[]> = {
  pending: ['pending'],
  recent: ['approved', 'merged'],
  rejected: ['rejected'],
}

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const tab: TabId =
    sp.tab === 'ingredients' || sp.tab === 'suggestions' ? sp.tab : 'products'
  const q = (sp.q ?? '').trim()
  const catFilter = (sp.cat ?? '').trim()
  const sub = sp.sub && SUB_STATUS[sp.sub] ? sp.sub : 'pending'
  const sort: SortKey =
    sp.sort === 'name_desc' || sp.sort === 'used' || sp.sort === 'used_desc'
      ? (sp.sort as SortKey)
      : 'name'
  const unusedOnly = sp.unused === '1'
  const incompleteOnly = sp.incomplete === '1'

  const admin = createAdminClient()

  // Always fetch the counts shown in the tab badges — cheap (head-only).
  const [
    { count: productCount },
    { count: ingredientCount },
    { count: pendingCount },
    { count: approvedWeekCount },
    { count: rejectedCount },
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
    admin.from('catalog_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
  ])

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Global catalog
          </div>
          <h1 className="op-title">
            Canonical <span className="it">library.</span>
          </h1>
          <p className="op-sub">
            Every product and ingredient shared across tenants lives here. Edit / delete the
            canonical rows, and moderate workspace suggestions before they land.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {tab === 'products' && (
            <Link href="/admin/catalog/products/new" className="op-btn primary">
              <OpIcon name="plus" size={12} />
              New product
            </Link>
          )}
          {tab === 'ingredients' && (
            <Link href="/admin/catalog/ingredients/new" className="op-btn primary">
              <OpIcon name="plus" size={12} />
              New ingredient
            </Link>
          )}
        </div>
      </div>

      {sp.action && <ActionToast action={sp.action} reason={sp.reason} />}

      {/* Top stats */}
      <div
        className="op-stats"
        style={{ marginBottom: 18, gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        <div className="op-stat">
          <div className="k">Products</div>
          <div className="v">{(productCount ?? 0).toLocaleString()}</div>
          <div className="d flat">canonical</div>
        </div>
        <div className="op-stat">
          <div className="k">Ingredients</div>
          <div className="v">{(ingredientCount ?? 0).toLocaleString()}</div>
          <div className="d flat">canonical</div>
        </div>
        <div className="op-stat">
          <div className="k">Pending review</div>
          <div className="v">{pendingCount ?? 0}</div>
          {(pendingCount ?? 0) > 0 ? (
            <div className="d warn">
              <OpIcon name="warning" size={11} />
              Queue requires review
            </div>
          ) : (
            <div className="d flat">Inbox clear</div>
          )}
        </div>
        <div className="op-stat">
          <div className="k">Approved / 7d</div>
          <div className="v">{approvedWeekCount ?? 0}</div>
        </div>
      </div>

      {/* Top-level tabs */}
      <div className="op-tabs" style={{ marginBottom: 14 }}>
        {(
          [
            { id: 'products', label: 'Products', count: productCount ?? 0 },
            { id: 'ingredients', label: 'Ingredients', count: ingredientCount ?? 0 },
            { id: 'suggestions', label: 'Suggestions', count: pendingCount ?? 0 },
          ] as Array<{ id: TabId; label: string; count: number }>
        ).map((t) => (
          <Link
            key={t.id}
            href={t.id === 'products' ? '/admin/catalog' : `/admin/catalog?tab=${t.id}`}
            className="op-tab"
            data-active={tab === t.id}
          >
            {t.label}
            <span className="count">{t.count}</span>
          </Link>
        ))}
      </div>

      {tab === 'products' && (
        <ProductsTab
          q={q}
          catFilter={catFilter}
          sort={sort}
          unusedOnly={unusedOnly}
          incompleteOnly={incompleteOnly}
          totalCount={productCount ?? 0}
        />
      )}
      {tab === 'ingredients' && (
        <IngredientsTab
          q={q}
          catFilter={catFilter}
          sort={sort}
          unusedOnly={unusedOnly}
          incompleteOnly={incompleteOnly}
          totalCount={ingredientCount ?? 0}
        />
      )}
      {tab === 'suggestions' && (
        <SuggestionsTab sub={sub} counts={{ pendingCount, approvedWeekCount, rejectedCount }} />
      )}
    </div>
  )
}

// ─── Products tab ────────────────────────────────────────────────────

async function ProductsTab({
  q,
  catFilter,
  sort,
  unusedOnly,
  incompleteOnly,
  totalCount,
}: {
  q: string
  catFilter: string
  sort: SortKey
  unusedOnly: boolean
  incompleteOnly: boolean
  totalCount: number
}) {
  const admin = createAdminClient()

  const [{ data: productRows }, { data: cocktailRows }] = await Promise.all([
    admin
      .from('global_products')
      .select('id, brand, expression, category, abv, origin, tagline, image_url, created_at')
      .order('brand')
      .order('expression')
      .limit(1000),
    admin.from('cocktails').select('id, base_product_id').not('base_product_id', 'is', null),
  ])

  const products = (productRows ?? []) as GlobalProduct[]
  const usage = new Map<string, number>()
  for (const c of (cocktailRows ?? []) as { id: string; base_product_id: string | null }[]) {
    if (!c.base_product_id) continue
    usage.set(c.base_product_id, (usage.get(c.base_product_id) ?? 0) + 1)
  }

  const categories = Array.from(
    new Set(products.map((p) => p.category ?? '').filter(Boolean)),
  ).sort() as string[]

  function isIncomplete(p: GlobalProduct): boolean {
    return !p.image_url || p.abv == null || !p.origin
  }

  const filtered = products.filter((p) => {
    if (catFilter && p.category !== catFilter) return false
    if (unusedOnly && (usage.get(p.id) ?? 0) > 0) return false
    if (incompleteOnly && !isIncomplete(p)) return false
    if (!q) return true
    const hay = `${p.brand} ${p.expression} ${p.origin ?? ''}`.toLowerCase()
    return hay.includes(q.toLowerCase())
  })

  filtered.sort((a, b) => {
    if (sort === 'name_desc') return `${b.brand} ${b.expression}`.localeCompare(`${a.brand} ${a.expression}`)
    if (sort === 'used_desc') return (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0)
    if (sort === 'used') return (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0)
    return `${a.brand} ${a.expression}`.localeCompare(`${b.brand} ${b.expression}`)
  })

  const incompleteCount = products.filter(isIncomplete).length
  const unusedCount = products.filter((p) => (usage.get(p.id) ?? 0) === 0).length

  return (
    <>
      <CatalogFilters
        placeholder="Search brand, expression, origin…"
        defaultQuery={q}
        categories={categories}
        currentCat={catFilter}
        basePath="/admin/catalog"
        resultCount={filtered.length}
        totalCount={totalCount}
        sort={sort}
        unusedOnly={unusedOnly}
        incompleteOnly={incompleteOnly}
        unusedCount={unusedCount}
        incompleteCount={incompleteCount}
      />

      <div className="op-card" style={{ padding: 0 }}>
        <div className="op-t-wrap">
          <table className="op-t">
            <thead>
              <tr>
                <SortHeader
                  label="Product"
                  sort={sort}
                  asc="name"
                  desc="name_desc"
                  basePath="/admin/catalog"
                  keepParams={{ q, cat: catFilter, unused: unusedOnly, incomplete: incompleteOnly }}
                />
                <th>Category</th>
                <th style={{ textAlign: 'right', width: 70 }}>ABV</th>
                <th>Origin</th>
                <SortHeader
                  label="Used by"
                  sort={sort}
                  asc="used"
                  desc="used_desc"
                  align="right"
                  width={110}
                  basePath="/admin/catalog"
                  keepParams={{ q, cat: catFilter, unused: unusedOnly, incomplete: incompleteOnly }}
                />
                <th style={{ width: 100, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="op-empty">
                    No products match these filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const used = usage.get(p.id) ?? 0
                  const incomplete = isIncomplete(p)
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link
                          href={`/admin/catalog/products/${p.id}`}
                          style={{
                            color: 'var(--op-ink-1)',
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                          }}
                        >
                          {incomplete && <IncompleteDot missing={missingLabels(p)} />}
                          <div>
                            <div style={{ fontWeight: 500 }}>{p.brand}</div>
                            <div
                              style={{
                                fontSize: 12,
                                color: 'var(--op-ink-3)',
                                marginTop: 2,
                              }}
                            >
                              {p.expression}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--op-ink-3)',
                        }}
                      >
                        {p.category ?? '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {p.abv != null ? `${p.abv}%` : '—'}
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--op-ink-2)' }}>
                        {p.origin ?? '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          color: used === 0 ? 'var(--op-ink-4)' : 'var(--op-ink-1)',
                        }}
                      >
                        {used} cocktail{used === 1 ? '' : 's'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/admin/catalog/products/${p.id}`}
                          className="op-btn sm"
                          style={{ fontSize: 11 }}
                        >
                          Edit
                          <OpIcon name="chevron" size={10} />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function missingLabels(p: GlobalProduct): string[] {
  const list: string[] = []
  if (!p.image_url) list.push('image')
  if (p.abv == null) list.push('ABV')
  if (!p.origin) list.push('origin')
  return list
}

// ─── Ingredients tab ──────────────────────────────────────────────────

async function IngredientsTab({
  q,
  catFilter,
  sort,
  unusedOnly,
  incompleteOnly,
  totalCount,
}: {
  q: string
  catFilter: string
  sort: SortKey
  unusedOnly: boolean
  incompleteOnly: boolean
  totalCount: number
}) {
  const admin = createAdminClient()

  const [{ data: ingredientRows }, { data: linkRows }] = await Promise.all([
    admin
      .from('global_ingredients')
      .select('id, name, category, default_unit, created_at')
      .order('name')
      .limit(2000),
    admin
      .from('cocktail_ingredients')
      .select('cocktail_id, global_ingredient_id')
      .not('global_ingredient_id', 'is', null),
  ])

  const ingredients = (ingredientRows ?? []) as GlobalIngredient[]
  const usage = new Map<string, Set<string>>()
  for (const l of (linkRows ?? []) as {
    cocktail_id: string
    global_ingredient_id: string | null
  }[]) {
    if (!l.global_ingredient_id) continue
    const hit = usage.get(l.global_ingredient_id)
    if (hit) hit.add(l.cocktail_id)
    else usage.set(l.global_ingredient_id, new Set([l.cocktail_id]))
  }

  const categories = Array.from(
    new Set(ingredients.map((i) => i.category ?? '').filter(Boolean)),
  ).sort() as string[]

  function isIncomplete(i: GlobalIngredient): boolean {
    return !i.category
  }

  const filtered = ingredients.filter((i) => {
    if (catFilter && i.category !== catFilter) return false
    if (unusedOnly && (usage.get(i.id)?.size ?? 0) > 0) return false
    if (incompleteOnly && !isIncomplete(i)) return false
    if (!q) return true
    return i.name.toLowerCase().includes(q.toLowerCase())
  })

  filtered.sort((a, b) => {
    if (sort === 'name_desc') return b.name.localeCompare(a.name)
    if (sort === 'used_desc') return (usage.get(b.id)?.size ?? 0) - (usage.get(a.id)?.size ?? 0)
    if (sort === 'used') return (usage.get(a.id)?.size ?? 0) - (usage.get(b.id)?.size ?? 0)
    return a.name.localeCompare(b.name)
  })

  const incompleteCount = ingredients.filter(isIncomplete).length
  const unusedCount = ingredients.filter((i) => (usage.get(i.id)?.size ?? 0) === 0).length

  return (
    <>
      <CatalogFilters
        placeholder="Search ingredient name…"
        defaultQuery={q}
        categories={categories}
        currentCat={catFilter}
        basePath="/admin/catalog?tab=ingredients"
        resultCount={filtered.length}
        totalCount={totalCount}
        sort={sort}
        unusedOnly={unusedOnly}
        incompleteOnly={incompleteOnly}
        unusedCount={unusedCount}
        incompleteCount={incompleteCount}
      />

      <div className="op-card" style={{ padding: 0 }}>
        <div className="op-t-wrap">
          <table className="op-t">
            <thead>
              <tr>
                <SortHeader
                  label="Ingredient"
                  sort={sort}
                  asc="name"
                  desc="name_desc"
                  basePath="/admin/catalog?tab=ingredients"
                  keepParams={{ q, cat: catFilter, unused: unusedOnly, incomplete: incompleteOnly }}
                />
                <th>Category</th>
                <th style={{ width: 100 }}>Default unit</th>
                <SortHeader
                  label="Used by"
                  sort={sort}
                  asc="used"
                  desc="used_desc"
                  align="right"
                  width={110}
                  basePath="/admin/catalog?tab=ingredients"
                  keepParams={{ q, cat: catFilter, unused: unusedOnly, incomplete: incompleteOnly }}
                />
                <th style={{ width: 100, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="op-empty">
                    No ingredients match these filters.
                  </td>
                </tr>
              ) : (
                filtered.map((ing) => {
                  const used = usage.get(ing.id)?.size ?? 0
                  const incomplete = isIncomplete(ing)
                  return (
                    <tr key={ing.id}>
                      <td>
                        <Link
                          href={`/admin/catalog/ingredients/${ing.id}`}
                          style={{
                            color: 'var(--op-ink-1)',
                            fontWeight: 500,
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                          }}
                        >
                          {incomplete && <IncompleteDot missing={['category']} />}
                          <span>{ing.name}</span>
                        </Link>
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--op-ink-3)',
                        }}
                      >
                        {ing.category ?? '—'}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--op-ink-3)',
                        }}
                      >
                        {ing.default_unit ?? '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          color: used === 0 ? 'var(--op-ink-4)' : 'var(--op-ink-1)',
                        }}
                      >
                        {used} cocktail{used === 1 ? '' : 's'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/admin/catalog/ingredients/${ing.id}`}
                          className="op-btn sm"
                          style={{ fontSize: 11 }}
                        >
                          Edit
                          <OpIcon name="chevron" size={10} />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ─── Suggestions tab ──────────────────────────────────────────────────

async function SuggestionsTab({
  sub,
  counts,
}: {
  sub: string
  counts: { pendingCount: number | null; approvedWeekCount: number | null; rejectedCount: number | null }
}) {
  const admin = createAdminClient()

  const { data: suggestions } = await admin
    .from('catalog_suggestions')
    .select(
      'id, kind, name, category, note, brand, expression, abv, origin, description, default_unit, status, suggested_by_user_id, suggested_from_workspace_id, suggested_at, reviewed_by, reviewed_at, rejection_reason, canonical_id',
    )
    .in('status', SUB_STATUS[sub] ?? ['pending'])
    .order(sub === 'pending' ? 'suggested_at' : 'reviewed_at', {
      ascending: sub === 'pending',
    })
    .limit(100)

  const rows = ((suggestions ?? []) as unknown as Suggestion[])

  // Dupe detection same as before — scoped to the loaded rows.
  const productSugs = rows.filter((r) => r.kind === 'product')
  const ingredientSugs = rows.filter((r) => r.kind === 'ingredient')
  const dupeMap = new Map<string, Dupe[]>()

  if (productSugs.length > 0) {
    const names = productSugs.flatMap((s) => [s.brand, s.expression].filter(Boolean)) as string[]
    if (names.length > 0) {
      const { data: gp } = await admin.from('global_products').select('id, brand, expression')
      const list = (gp ?? []) as { id: string; brand: string; expression: string }[]
      for (const s of productSugs) {
        const needle = `${s.brand ?? ''} ${s.expression ?? ''}`.toLowerCase()
        const matches = list.filter((g) => {
          const hay = `${g.brand} ${g.expression}`.toLowerCase()
          return hay.includes((s.brand ?? '').toLowerCase()) ||
            hay.includes((s.expression ?? '').toLowerCase())
        })
        if (matches.length > 0) {
          dupeMap.set(
            s.id,
            matches.slice(0, 3).map((m) => ({
              id: m.id,
              label: `${m.brand} · ${m.expression}`,
              kind: 'product' as const,
            })),
          )
        }
        void needle
      }
    }
  }
  if (ingredientSugs.length > 0) {
    const { data: gi } = await admin.from('global_ingredients').select('id, name')
    const list = (gi ?? []) as { id: string; name: string }[]
    for (const s of ingredientSugs) {
      const matches = list.filter((g) =>
        g.name.toLowerCase().includes((s.name ?? '').toLowerCase()),
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
    <>
      <div className="op-tabs" style={{ marginBottom: 14 }}>
        {[
          { id: 'pending', label: 'Pending', count: counts.pendingCount ?? 0 },
          { id: 'recent', label: 'Recently approved', count: counts.approvedWeekCount ?? 0 },
          { id: 'rejected', label: 'Rejected', count: counts.rejectedCount ?? 0 },
        ].map((t) => (
          <Link
            key={t.id}
            href={`/admin/catalog?tab=suggestions${t.id === 'pending' ? '' : '&sub=' + t.id}`}
            className="op-tab"
            data-active={sub === t.id}
          >
            {t.label}
            <span className="count">{t.count}</span>
          </Link>
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
                marginBottom: 10,
              }}
            >
              <OpIcon name="catalog" size={20} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
              {sub === 'pending'
                ? 'Moderation queue is empty.'
                : sub === 'recent'
                  ? 'No recent approvals.'
                  : 'Nothing rejected.'}
            </div>
            <p
              className="mut"
              style={{ fontSize: 13, margin: '0 auto', maxWidth: '50ch', lineHeight: 1.55 }}
            >
              {sub === 'pending'
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
    </>
  )
}

// ─── Filters bar (shared across Products / Ingredients tabs) ──────────

function CatalogFilters({
  placeholder,
  defaultQuery,
  categories,
  currentCat,
  basePath,
  resultCount,
  totalCount,
  sort,
  unusedOnly,
  incompleteOnly,
  unusedCount,
  incompleteCount,
}: {
  placeholder: string
  defaultQuery: string
  categories: string[]
  currentCat: string
  basePath: string
  resultCount: number
  totalCount: number
  sort: SortKey
  unusedOnly: boolean
  incompleteOnly: boolean
  unusedCount: number
  incompleteCount: number
}) {
  const isIngredients = basePath.includes('tab=ingredients')
  return (
    <div
      className="op-card"
      style={{
        padding: 12,
        marginBottom: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <form
        method="GET"
        action={basePath.split('?')[0]!}
        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
      >
        {isIngredients && <input type="hidden" name="tab" value="ingredients" />}
        {sort !== 'name' && <input type="hidden" name="sort" value={sort} />}
        {unusedOnly && <input type="hidden" name="unused" value="1" />}
        {incompleteOnly && <input type="hidden" name="incomplete" value="1" />}
        <div style={{ position: 'relative', flex: 1 }}>
          <OpIcon
            name="search"
            size={13}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--op-ink-4)',
            }}
          />
          <input
            type="text"
            name="q"
            defaultValue={defaultQuery}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              background: 'var(--op-surface)',
              border: '1px solid var(--op-line)',
              borderRadius: 8,
              color: 'var(--op-ink-1)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
        <select
          name="cat"
          defaultValue={currentCat}
          style={{
            padding: '8px 28px 8px 12px',
            background: 'var(--op-surface)',
            border: '1px solid var(--op-line)',
            borderRadius: 8,
            color: 'var(--op-ink-1)',
            fontSize: 12.5,
            minWidth: 160,
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" className="op-btn primary" style={{ fontSize: 12 }}>
          Apply
        </button>
        {(defaultQuery || currentCat) && (
          <Link
            href={buildListHref(basePath, {
              sort: sort === 'name' ? undefined : sort,
              unused: unusedOnly ? '1' : undefined,
              incomplete: incompleteOnly ? '1' : undefined,
            })}
            className="op-btn ghost"
            style={{ fontSize: 12 }}
          >
            Clear
          </Link>
        )}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--op-ink-4)',
            marginLeft: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {resultCount.toLocaleString()} / {totalCount.toLocaleString()}
        </div>
      </form>

      {/* Quick filter toggles */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterToggle
          active={unusedOnly}
          label={`Unused only (${unusedCount})`}
          onHref={buildListHref(basePath, {
            q: defaultQuery,
            cat: currentCat,
            sort: sort === 'name' ? undefined : sort,
            unused: '1',
            incomplete: incompleteOnly ? '1' : undefined,
          })}
          offHref={buildListHref(basePath, {
            q: defaultQuery,
            cat: currentCat,
            sort: sort === 'name' ? undefined : sort,
            incomplete: incompleteOnly ? '1' : undefined,
          })}
        />
        <FilterToggle
          active={incompleteOnly}
          label={`Incomplete only (${incompleteCount})`}
          onHref={buildListHref(basePath, {
            q: defaultQuery,
            cat: currentCat,
            sort: sort === 'name' ? undefined : sort,
            unused: unusedOnly ? '1' : undefined,
            incomplete: '1',
          })}
          offHref={buildListHref(basePath, {
            q: defaultQuery,
            cat: currentCat,
            sort: sort === 'name' ? undefined : sort,
            unused: unusedOnly ? '1' : undefined,
          })}
        />
        {sort !== 'name' && (
          <Link
            href={buildListHref(basePath, {
              q: defaultQuery,
              cat: currentCat,
              unused: unusedOnly ? '1' : undefined,
              incomplete: incompleteOnly ? '1' : undefined,
            })}
            className="op-btn ghost sm"
            style={{ fontSize: 11 }}
          >
            Reset sort ({sortLabel(sort)})
          </Link>
        )}
      </div>
    </div>
  )
}

function FilterToggle({
  active,
  label,
  onHref,
  offHref,
}: {
  active: boolean
  label: string
  onHref: string
  offHref: string
}) {
  return (
    <Link
      href={active ? offHref : onHref}
      className="op-chip"
      style={{
        fontSize: 11.5,
        padding: '5px 10px',
        background: active ? 'var(--op-accent-w)' : 'transparent',
        color: active ? 'var(--op-accent)' : 'var(--op-ink-3)',
        border: `1px solid ${active ? 'var(--op-accent-w)' : 'var(--op-line)'}`,
        cursor: 'pointer',
      }}
    >
      {active && <OpIcon name="check" size={11} />}
      {label}
    </Link>
  )
}

function SortHeader({
  label,
  sort,
  asc,
  desc,
  align,
  width,
  basePath,
  keepParams,
}: {
  label: string
  sort: SortKey
  asc: SortKey
  desc: SortKey
  align?: 'right'
  width?: number
  basePath: string
  keepParams: { q: string; cat: string; unused: boolean; incomplete: boolean }
}) {
  const isActive = sort === asc || sort === desc
  const next = sort === asc ? desc : asc
  const href = buildListHref(basePath, {
    q: keepParams.q,
    cat: keepParams.cat,
    sort: next === 'name' ? undefined : next,
    unused: keepParams.unused ? '1' : undefined,
    incomplete: keepParams.incomplete ? '1' : undefined,
  })
  const arrow = !isActive ? '' : sort === desc ? ' ↓' : ' ↑'
  return (
    <th style={{ textAlign: align, width }}>
      <Link
        href={href}
        style={{
          color: isActive ? 'var(--op-ink-1)' : 'var(--op-ink-3)',
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        {label}
        {arrow}
      </Link>
    </th>
  )
}

function IncompleteDot({ missing }: { missing: string[] }) {
  return (
    <span
      title={`Missing: ${missing.join(', ')}`}
      aria-label={`Incomplete — missing ${missing.join(', ')}`}
      style={{
        width: 7,
        height: 7,
        borderRadius: 999,
        background: 'var(--op-warn)',
        marginTop: 7,
        flexShrink: 0,
      }}
    />
  )
}

function sortLabel(s: SortKey): string {
  if (s === 'name_desc') return 'Z → A'
  if (s === 'used') return 'Least used'
  if (s === 'used_desc') return 'Most used'
  return 'A → Z'
}

function buildListHref(
  basePath: string,
  params: Record<string, string | undefined>,
): string {
  const [path, existingQuery] = basePath.split('?')
  const sp = new URLSearchParams(existingQuery ?? '')
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    sp.set(k, v)
  }
  const qs = sp.toString()
  return qs ? `${path}?${qs}` : path!
}

// ─── Action toast (kept from original) ────────────────────────────────

const ACTION_SUCCESS: Record<string, string> = {
  approve_ok: 'Suggestion approved and added to the canonical catalog.',
  reject_ok: 'Suggestion rejected. Submitter will see the reason if they look.',
  merge_ok: 'Suggestion merged into existing canonical entry.',
  product_saved: 'Product updated.',
  product_deleted: 'Product deleted from the canonical catalog.',
  ingredient_saved: 'Ingredient updated.',
  ingredient_deleted: 'Ingredient deleted from the canonical catalog.',
}

const ACTION_ERROR: Record<string, string> = {
  not_pending: 'This suggestion has already been reviewed.',
  missing_product_fields: 'Product is missing brand, expression, or category.',
  missing_name: 'Suggestion has no name.',
  missing_target: 'Pick a canonical entry to merge into first.',
  target_not_found: 'Merge target no longer exists.',
  duplicate_product: 'A product with that brand + expression already exists.',
  duplicate_ingredient: 'An ingredient with that name already exists.',
  in_use: 'Entry is still referenced by cocktails or workspaces — clear usage first.',
  insert_failed: 'Database insert failed. Check logs.',
  update_failed: 'Database update failed. Check logs.',
  delete_failed: 'Database delete failed. Check logs.',
  unknown_op: 'Unknown action.',
}

function ActionToast({ action, reason }: { action: string; reason?: string }) {
  const ok = action.endsWith('_ok') || action.endsWith('_saved') || action.endsWith('_deleted')
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
export const _unused = { timeAgo }
