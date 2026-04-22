import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

import { getCurrentWorkspace } from '@/lib/workspace/context'
import { requireUser } from '@/lib/auth/session'
import { SectionHead } from '@/components/SectionHead'
import { StatCard } from '@/components/StatCard'
import { BarRow } from '@/components/BarRow'
import { Avatar } from '@/components/cocktail/Avatar'
import { Icon } from '@/components/icons'

type CocktailRow = {
  id: string
  name: string
  status: string
  category: string | null
  spirit_base: string | null
  glass_type: string | null
  season: string[] | null
  flavor_profile: string[] | null
  menu_price_cents: number | null
  cost_cents: number | null
  created_at: string | null
  creators: { id: string; name: string; city: string | null } | null
  global_products: { id: string; brand: string; expression: string } | null
}

type CreatorRow = { id: string; name: string; role: string | null; city: string | null }

type IngredientUsageRow = {
  name: string
  usage_count: number
}

function dollars(cents: number | null | undefined): string {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

export default async function AnalyticsPage() {
  await requireUser()
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const [
    { data: cocktailsData },
    { data: creatorsData },
    { data: ingredientRows },
    { data: collectionMemberRows },
    { data: collectionRows },
    { data: settingsData },
  ] = await Promise.all([
    supabase
      .from('cocktails')
      .select(
        'id, name, status, category, spirit_base, glass_type, season, flavor_profile, menu_price_cents, cost_cents, created_at, creators(id, name, city), global_products(id, brand, expression)',
      )
      .eq('workspace_id', workspace.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false }),
    supabase
      .from('creators')
      .select('id, name, role, city')
      .eq('workspace_id', workspace.id),
    // Pre-aggregated ingredient usage view (workspace-scoped)
    supabase
      .from('workspace_ingredient_usage')
      .select('name, usage_count')
      .eq('workspace_id', workspace.id)
      .order('usage_count', { ascending: false })
      .limit(10),
    // Collection memberships for this workspace's cocktails
    supabase
      .from('collection_cocktails')
      .select('cocktail_id, collection_id, collections!inner(workspace_id)')
      .eq('collections.workspace_id', workspace.id),
    // All collections for this workspace (even empty ones)
    supabase
      .from('collections')
      .select('id, name, pinned')
      .eq('workspace_id', workspace.id),
    // Workspace preferences (pricing visibility)
    supabase
      .from('workspace_settings')
      .select('pricing_enabled')
      .eq('workspace_id', workspace.id)
      .maybeSingle(),
  ])

  const cocktails = (cocktailsData ?? []) as unknown as CocktailRow[]
  const creators = (creatorsData ?? []) as unknown as CreatorRow[]
  const ingredients = (ingredientRows ?? []) as unknown as IngredientUsageRow[]
  const collectionMembers = (collectionMemberRows ?? []) as unknown as {
    cocktail_id: string
    collection_id: string
  }[]
  const collectionsList = (collectionRows ?? []) as unknown as {
    id: string
    name: string
    pinned: boolean
  }[]
  // Default pricing to ON when settings row missing (backwards compatible)
  const pricingEnabled =
    (settingsData as { pricing_enabled: boolean | null } | null)?.pricing_enabled !== false

  // ── Totals
  const total = cocktails.length
  const published = cocktails.filter((c) => c.status === 'published').length
  const drafts = cocktails.filter((c) => c.status === 'draft').length
  const review = cocktails.filter((c) => c.status === 'review').length

  const priced = cocktails.filter(
    (c) => typeof c.menu_price_cents === 'number' && c.menu_price_cents > 0,
  )
  const avgPrice =
    priced.length > 0
      ? priced.reduce((s, c) => s + (c.menu_price_cents ?? 0), 0) / priced.length
      : null
  const withCost = cocktails.filter(
    (c) => typeof c.cost_cents === 'number' && c.cost_cents > 0,
  )
  const avgCost =
    withCost.length > 0
      ? withCost.reduce((s, c) => s + (c.cost_cents ?? 0), 0) / withCost.length
      : null

  // Drinks priced AND with cost — compute margin
  const margins = cocktails
    .filter(
      (c) =>
        typeof c.menu_price_cents === 'number' &&
        c.menu_price_cents > 0 &&
        typeof c.cost_cents === 'number' &&
        c.cost_cents > 0,
    )
    .map((c) => ({
      name: c.name,
      price: c.menu_price_cents as number,
      cost: c.cost_cents as number,
      marginPct: ((c.menu_price_cents as number) - (c.cost_cents as number)) / (c.menu_price_cents as number),
    }))
  const avgMarginPct =
    margins.length > 0 ? margins.reduce((s, m) => s + m.marginPct, 0) / margins.length : null

  // ── Breakdowns
  const bySpirit = new Map<string, number>()
  const byProduct = new Map<string, number>()
  const byCategory = new Map<string, number>()
  const byGlass = new Map<string, number>()
  const bySeason = new Map<string, number>()
  const byFlavor = new Map<string, number>()
  for (const c of cocktails) {
    if (c.spirit_base) bySpirit.set(c.spirit_base, (bySpirit.get(c.spirit_base) ?? 0) + 1)
    if (c.global_products) {
      byProduct.set(
        c.global_products.expression,
        (byProduct.get(c.global_products.expression) ?? 0) + 1,
      )
    }
    if (c.category) byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + 1)
    if (c.glass_type) byGlass.set(c.glass_type, (byGlass.get(c.glass_type) ?? 0) + 1)
    for (const s of c.season ?? []) bySeason.set(s.toLowerCase(), (bySeason.get(s.toLowerCase()) ?? 0) + 1)
    for (const f of c.flavor_profile ?? []) byFlavor.set(f, (byFlavor.get(f) ?? 0) + 1)
  }

  // Detect mono-spirit workspace (e.g. Casa Dragones — only tequila but
  // multiple expressions). Pivot the "Base spirit" panel to show the
  // product breakdown instead, which is the meaningful axis.
  const monoSpirit = bySpirit.size <= 1 && byProduct.size >= 2
  const spiritEntries = [...bySpirit.entries()].sort((a, b) => b[1] - a[1])
  const productEntries = [...byProduct.entries()].sort((a, b) => b[1] - a[1])
  const categoryEntries = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const glassEntries = [...byGlass.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const seasonOrder = ['spring', 'summer', 'autumn', 'fall', 'winter']
  const seasonEntries = seasonOrder
    .map((s) => [s === 'fall' ? 'autumn' : s, bySeason.get(s) ?? 0] as const)
    .filter(([, n]) => n > 0)
  // Collapse 'fall' into 'autumn' if both exist (alias)
  const seasonDeduped = [
    ...new Map(seasonEntries).entries(),
  ] as [string, number][]
  const flavorEntries = [...byFlavor.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)

  // ── 12-month growth timeline
  const now = new Date()
  const monthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const timelineBuckets: { key: string; label: string; year: number; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    timelineBuckets.push({ key: monthKey(d), label: monthLabel(d), year: d.getFullYear(), count: 0 })
  }
  for (const c of cocktails) {
    if (!c.created_at) continue
    const d = new Date(c.created_at)
    const key = monthKey(d)
    const bucket = timelineBuckets.find((b) => b.key === key)
    if (bucket) bucket.count += 1
  }
  const timelineMax = timelineBuckets.reduce((m, b) => (b.count > m ? b.count : m), 0)
  const timelineTotal = timelineBuckets.reduce((s, b) => s + b.count, 0)

  // ── Collections breakdown
  const cocktailIdSet = new Set(cocktails.map((c) => c.id))
  const inAnyCollection = new Set<string>()
  const countByCollection = new Map<string, number>()
  for (const m of collectionMembers) {
    if (!cocktailIdSet.has(m.cocktail_id)) continue
    inAnyCollection.add(m.cocktail_id)
    countByCollection.set(m.collection_id, (countByCollection.get(m.collection_id) ?? 0) + 1)
  }
  const collectionsTotal = collectionsList.length
  const pinnedCount = collectionsList.filter((c) => c.pinned).length
  const coveredCount = inAnyCollection.size
  const coverageRatio = total > 0 ? coveredCount / total : 0
  const avgPerCollection =
    collectionsTotal > 0
      ? [...countByCollection.values()].reduce((s, n) => s + n, 0) / collectionsTotal
      : 0
  const topCollections = collectionsList
    .map((c) => ({ ...c, count: countByCollection.get(c.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const topCollectionMax = topCollections[0]?.count ?? 0

  // ── Top ingredients (from the pre-aggregated view)
  //    Display the share as "% of cocktails that use it", not "% of all
  //    pours" — more intuitive. Usage_count ≈ number of cocktails using
  //    the ingredient (in the rare case it's listed twice in the same
  //    cocktail the share caps at total).
  const topIngredients: [string, number][] = ingredients.map((r) => [r.name, r.usage_count])

  // ── Creator leaderboard
  const countByCreator = new Map<string, number>()
  for (const c of cocktails) {
    if (!c.creators?.id) continue
    countByCreator.set(c.creators.id, (countByCreator.get(c.creators.id) ?? 0) + 1)
  }
  const leaderboard = creators
    .map((cr) => ({ ...cr, count: countByCreator.get(cr.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // ── Price histogram (buckets by $5)
  const priceValues = priced.map((c) => (c.menu_price_cents as number) / 100)
  const bucketSize = 5
  const priceMaxVal = priceValues.length > 0 ? Math.max(...priceValues) : 0
  const bucketCount = Math.max(1, Math.ceil((priceMaxVal + 0.01) / bucketSize))
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    from: i * bucketSize,
    to: (i + 1) * bucketSize,
    count: 0,
  }))
  for (const v of priceValues) {
    const i = Math.min(bucketCount - 1, Math.floor(v / bucketSize))
    buckets[i]!.count += 1
  }
  const bucketMax = buckets.reduce((m, b) => (b.count > m ? b.count : m), 0)

  // ── Top margin cocktails
  const topMargin = [...margins].sort((a, b) => b.marginPct - a.marginPct).slice(0, 5)
  const lowMargin = [...margins].sort((a, b) => a.marginPct - b.marginPct).slice(0, 3)

  // ── Empty state
  if (total === 0) {
    return (
      <div className="page fade-up">
        <div className="page-head">
          <div className="page-kicker">Analytics</div>
          <h1 className="page-title">Nothing to chart yet.</h1>
          <p className="page-sub">
            Add a few cocktails and we&rsquo;ll start building a picture of {workspace.name}&rsquo;s
            library — spirit mix, creator contributions, pricing and margins.
          </p>
        </div>
        <div className="card card-pad" style={{ padding: 28, textAlign: 'center' }}>
          <Link href="/cocktails/new" className="btn-primary">
            <Icon name="plus" size={13} />
            New cocktail
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div className="page-kicker">Analytics · {workspace.name}</div>
        <h1 className="page-title">Library at a glance.</h1>
        <p className="page-sub">
          {total} active cocktail{total === 1 ? '' : 's'} · {creators.length} creator
          {creators.length === 1 ? '' : 's'} · {published} on menu, {review} in review, {drafts}{' '}
          draft{drafts === 1 ? '' : 's'}. No POS data connected — ratings and sell-through land when
          you link a till.
        </p>
      </div>

      {/* Hero stat row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: pricingEnabled ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
          gap: 'var(--density-gap)',
        }}
      >
        <StatCard
          kicker="Menu size"
          value={published}
          sub={`${total} total · ${review + drafts} in pipeline`}
        />
        <StatCard
          kicker="Creators"
          value={creators.length}
          sub={`${leaderboard[0]?.count ?? 0} top contribution${(leaderboard[0]?.count ?? 0) === 1 ? '' : 's'}`}
        />
        <StatCard
          kicker="Ingredients"
          value={ingredients.length}
          sub="most-used shown below"
        />
        {pricingEnabled && (
          <StatCard
            kicker="Avg. margin"
            value={avgMarginPct != null ? `${Math.round(avgMarginPct * 100)}%` : '—'}
            sub={avgMarginPct != null ? `${margins.length} priced + costed` : 'Needs price & cost'}
            accent
          />
        )}
      </div>

      {/* Library growth timeline */}
      <div
        className="card card-pad"
        style={{ padding: 22, marginTop: 36 }}
      >
        <SectionHead
          kicker="Portfolio"
          title="Library growth · last 12 months"
          action={
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
              {timelineTotal} added in period
            </span>
          }
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${timelineBuckets.length}, 1fr)`,
            gap: 6,
            alignItems: 'end',
            paddingTop: 8,
          }}
        >
          {timelineBuckets.map((b, i) => {
            const h = timelineMax > 0 ? (b.count / timelineMax) * 100 : 0
            const isNewYear =
              i > 0 && b.year !== timelineBuckets[i - 1]!.year
            return (
              <div
                key={b.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  borderLeft: isNewYear ? '1px dashed var(--line-2)' : 'none',
                  paddingLeft: isNewYear ? 4 : 0,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-4)',
                    fontVariantNumeric: 'tabular-nums',
                    minHeight: 12,
                  }}
                >
                  {b.count > 0 ? b.count : ''}
                </span>
                <div
                  style={{
                    width: '100%',
                    height: 120,
                    display: 'flex',
                    alignItems: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${h}%`,
                      minHeight: b.count > 0 ? 4 : 0,
                      background: b.count > 0 ? 'var(--accent)' : 'var(--line-2)',
                      borderRadius: 5,
                    }}
                  />
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-4)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {b.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Collections panel */}
      <div
        className="card card-pad"
        style={{ padding: 22, marginTop: 24 }}
      >
        <SectionHead
          kicker="Collections"
          title="Menu groupings"
          action={
            <Link href="/collections" className="btn-ghost">
              Manage collections <Icon name="chevron-r" size={12} />
            </Link>
          }
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginTop: 6,
            marginBottom: 20,
          }}
        >
          <MiniStat
            kicker="Total"
            value={collectionsTotal}
            sub={pinnedCount > 0 ? `${pinnedCount} pinned` : 'None pinned'}
          />
          <MiniStat
            kicker="Coverage"
            value={total > 0 ? `${Math.round(coverageRatio * 100)}%` : '—'}
            sub={`${coveredCount} of ${total} cocktails`}
          />
          <MiniStat
            kicker="Avg / collection"
            value={collectionsTotal > 0 ? avgPerCollection.toFixed(1) : '—'}
            sub="cocktails grouped"
          />
          <MiniStat
            kicker="Orphans"
            value={total - coveredCount}
            sub="not in any collection"
            muted={total - coveredCount === 0}
          />
        </div>

        {topCollections.length > 0 ? (
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--line-2)' }}>
            <div
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--ink-4)',
                marginBottom: 10,
              }}
            >
              Largest collections
            </div>
            <div className="col" style={{ gap: 2 }}>
              {topCollections.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.2fr 90px',
                    alignItems: 'center',
                    gap: 14,
                    padding: '10px 0',
                    borderTop: i > 0 ? '1px solid var(--line-2)' : 'none',
                    textDecoration: 'none',
                    color: 'var(--ink-1)',
                  }}
                >
                  <span
                    className="row gap-sm"
                    style={{ alignItems: 'center', minWidth: 0 }}
                  >
                    {c.pinned && (
                      <Icon
                        name="pin"
                        size={10}
                        style={{ color: 'var(--accent-ink)', flexShrink: 0 }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.name}
                    </span>
                  </span>
                  <div
                    className="bar-track"
                    style={{
                      height: 6,
                      borderRadius: 999,
                      background: 'var(--bg-sunken)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${topCollectionMax > 0 ? (c.count / topCollectionMax) * 100 : 0}%`,
                        background: i === 0 ? 'var(--accent)' : 'var(--ink-1)',
                      }}
                    />
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11.5,
                      color: 'var(--ink-2)',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {c.count} cocktail{c.count === 1 ? '' : 's'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <EmptyHint text="Create a collection to group cocktails by menu, theme, or event." />
        )}
      </div>

      {/* Distributions row 1 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--density-gap)',
          marginTop: 36,
        }}
      >
        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead
            kicker={monoSpirit ? 'Expressions' : 'Base spirit'}
            title={monoSpirit ? 'By product' : 'By spirit'}
          />
          {monoSpirit ? (
            productEntries.length === 0 ? (
              <EmptyHint text="Link cocktails to a product bottle to see the breakdown." />
            ) : (
              productEntries.map(([name, n], i) => (
                <BarRow
                  key={name}
                  label={name}
                  value={n}
                  max={total}
                  total={total}
                  accent={i === 0}
                />
              ))
            )
          ) : spiritEntries.length === 0 ? (
            <EmptyHint text="Set a base spirit on your cocktails." />
          ) : (
            spiritEntries.map(([spirit, n], i) => (
              <BarRow
                key={spirit}
                label={spirit}
                value={n}
                max={total}
                total={total}
                accent={i === 0}
              />
            ))
          )}
        </div>
        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead kicker="Categories" title="By style" />
          {categoryEntries.length === 0 ? (
            <EmptyHint text="Tag each cocktail with a category (e.g. Sour, Highball)." />
          ) : (
            categoryEntries.map(([cat, n], i) => (
              <BarRow
                key={cat}
                label={cat}
                value={n}
                max={total}
                total={total}
                accent={i === 0}
              />
            ))
          )}
        </div>
      </div>

      {/* Distributions row 2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--density-gap)',
          marginTop: 24,
        }}
      >
        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead kicker="Glassware" title="By glass" />
          {glassEntries.length === 0 ? (
            <EmptyHint text="Set a glass for each cocktail to see mix." />
          ) : (
            glassEntries.map(([g, n], i) => (
              <BarRow
                key={g}
                label={g}
                value={n}
                max={total}
                total={total}
                accent={i === 0}
              />
            ))
          )}
        </div>
        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead kicker="Seasonality" title="By season" />
          {seasonDeduped.length === 0 ? (
            <EmptyHint text="Tag cocktails with a season to surface rotation." />
          ) : (
            seasonDeduped.map(([s, n], i) => (
              <BarRow
                key={s}
                label={s.charAt(0).toUpperCase() + s.slice(1)}
                value={n}
                max={total}
                total={total}
                accent={i === 0}
              />
            ))
          )}
        </div>
      </div>

      {/* Creators + Ingredients */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 'var(--density-gap)',
          marginTop: 36,
        }}
      >
        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead
            kicker="People"
            title="Creator leaderboard"
            action={
              <Link href="/creators" className="btn-ghost">
                All creators <Icon name="chevron-r" size={12} />
              </Link>
            }
          />
          {leaderboard.length === 0 ? (
            <EmptyHint text="Credit creators on your cocktails to see a leaderboard." />
          ) : (
            leaderboard.map((cr, i) => (
              <Link
                key={cr.id}
                href={`/creators/${cr.id}`}
                className="row"
                style={{
                  gap: 12,
                  padding: '12px 0',
                  borderTop: i ? '1px solid var(--line-2)' : 'none',
                  alignItems: 'center',
                }}
              >
                <span
                  className="mono"
                  style={{ width: 22, fontSize: 11, color: 'var(--ink-4)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Avatar name={cr.name} size={32} />
                <div className="col" style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{cr.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>
                    {[cr.role, cr.city].filter(Boolean).join(' · ') || '—'}
                  </span>
                </div>
                <div
                  className="bar-track"
                  style={{
                    flex: 1,
                    maxWidth: 160,
                    height: 6,
                    borderRadius: 999,
                    background: 'var(--bg-sunken)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${total > 0 ? (cr.count / total) * 100 : 0}%`,
                      background: i === 0 ? 'var(--accent)' : 'var(--ink-1)',
                    }}
                  />
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-2)',
                    width: 88,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {cr.count}
                  {total > 0 && (
                    <span style={{ color: 'var(--ink-4)', marginLeft: 6 }}>
                      {(cr.count / total) * 100 < 1
                        ? '<1'
                        : Math.round((cr.count / total) * 100)}
                      %
                    </span>
                  )}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead
            kicker="Ingredients"
            title="Most-used pours"
            action={
              <Link href="/ingredients" className="btn-ghost">
                All ingredients <Icon name="chevron-r" size={12} />
              </Link>
            }
          />
          {topIngredients.length === 0 ? (
            <EmptyHint text="Add ingredients to your recipes to see usage." />
          ) : (
            topIngredients.map(([name, n], i) => (
              <BarRow
                key={name}
                label={name}
                value={n}
                max={total}
                total={total}
                accent={i === 0}
              />
            ))
          )}
        </div>
      </div>

      {/* Price histogram + Margin leaders */}
      {pricingEnabled && (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 'var(--density-gap)',
          marginTop: 36,
        }}
      >
        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead
            kicker="Pricing"
            title="Menu price distribution"
            action={
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-4)' }}
              >
                ${bucketSize} buckets · {priced.length} priced
              </span>
            }
          />
          {priceValues.length === 0 ? (
            <EmptyHint text="Add menu prices to see distribution." />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${buckets.length}, 1fr)`,
                gap: 8,
                alignItems: 'end',
                height: 140,
                paddingTop: 8,
              }}
            >
              {buckets.map((b, i) => (
                <div key={i} className="col" style={{ gap: 6, alignItems: 'center' }}>
                  <span
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--ink-4)' }}
                  >
                    {b.count || ''}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: bucketMax > 0 ? `${(b.count / bucketMax) * 100}%` : 0,
                      minHeight: b.count > 0 ? 4 : 0,
                      background: 'var(--accent)',
                      borderRadius: 6,
                    }}
                  />
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--ink-4)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ${b.from}–${b.to}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead kicker="Margin" title="Top margin specs" />
          {topMargin.length === 0 ? (
            <EmptyHint text="Add both price and cost to see margin leaders." />
          ) : (
            topMargin.map((m, i) => (
              <div
                key={m.name}
                className="row"
                style={{
                  padding: '10px 0',
                  borderTop: i ? '1px solid var(--line-2)' : 'none',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div className="col" style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                  <span
                    className="mono"
                    style={{ fontSize: 10.5, color: 'var(--ink-4)' }}
                  >
                    {dollars(m.cost)} → {dollars(m.price)}
                  </span>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    color: 'var(--accent-ink)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.round(m.marginPct * 100)}%
                </span>
              </div>
            ))
          )}
          {lowMargin.length > 0 && (
            <div
              className="col"
              style={{
                marginTop: 14,
                padding: 12,
                background: 'var(--bg-sunken)',
                borderRadius: 10,
                gap: 4,
              }}
            >
              <span
                className="page-kicker"
                style={{ fontSize: 9.5, color: 'var(--ink-4)' }}
              >
                Watchlist · lowest margins
              </span>
              {lowMargin.map((m) => (
                <div
                  key={m.name}
                  className="row"
                  style={{ justifyContent: 'space-between', fontSize: 12 }}
                >
                  <span>{m.name}</span>
                  <span className="mono" style={{ color: 'var(--crit)' }}>
                    {Math.round(m.marginPct * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Flavor + POS teaser */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 'var(--density-gap)',
          marginTop: 36,
        }}
      >
        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead kicker="Palate" title="Flavor profile mix" />
          {flavorEntries.length === 0 ? (
            <EmptyHint text="Tag cocktails with flavor notes to see profile mix." />
          ) : (
            <div
              className="row"
              style={{ flexWrap: 'wrap', gap: 8, paddingTop: 4 }}
            >
              {flavorEntries.map(([f, n], i) => {
                const share = total > 0 ? (n / total) * 100 : 0
                return (
                  <span
                    key={f}
                    className="pill"
                    style={{
                      fontSize: 12,
                      background: i === 0 ? 'var(--accent-wash)' : 'var(--bg-sunken)',
                      color: i === 0 ? 'var(--accent-ink)' : 'var(--ink-2)',
                      borderColor: 'transparent',
                    }}
                  >
                    {f}
                    <span
                      className="mono"
                      style={{ fontSize: 10.5, marginLeft: 6, color: 'var(--ink-4)' }}
                    >
                      {n}
                      {total > 0 && (
                        <span style={{ marginLeft: 4 }}>
                          · {share < 1 ? '<1' : Math.round(share)}%
                        </span>
                      )}
                    </span>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <div
          className="card card-pad"
          style={{
            padding: 22,
            background: 'var(--bg-sunken)',
            border: '1px dashed var(--line-1)',
            boxShadow: 'none',
          }}
        >
          <div className="page-kicker" style={{ marginBottom: 6 }}>
            Coming soon
          </div>
          <h3
            style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 20,
            }}
          >
            POS &amp; sell-through.
          </h3>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 14px', lineHeight: 1.55 }}>
            Connect a till (Square, Lightspeed, Toast) and this page surfaces velocity, profit per
            spec, 86&rsquo;d drinks, and season-over-season trend.
          </p>
          <Link href="/settings" className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
            <Icon name="plug" size={12} />
            Open integrations
          </Link>
        </div>
      </div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={{ padding: '18px 0', color: 'var(--ink-4)', fontSize: 13 }}>{text}</div>
  )
}

function MiniStat({
  kicker,
  value,
  sub,
  muted,
}: {
  kicker: string
  value: string | number
  sub?: string
  muted?: boolean
}) {
  return (
    <div className="col" style={{ gap: 4 }}>
      <span
        className="mono"
        style={{
          fontSize: 9.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-4)',
        }}
      >
        {kicker}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: muted ? 'var(--ink-4)' : 'var(--ink-1)',
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{sub}</span>
      )}
    </div>
  )
}
