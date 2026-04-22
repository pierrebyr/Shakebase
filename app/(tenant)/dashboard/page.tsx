import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import { Avatar } from '@/components/cocktail/Avatar'
import { Icon } from '@/components/icons'
import { SectionHead } from '@/components/SectionHead'
import { BarRow } from '@/components/BarRow'
import { StatCard } from '@/components/StatCard'
import { Reveal } from '@/components/motion/Reveal'
import { greeting, relTime, isoWeek, seasonLabel } from '@/lib/datetime'

export const dynamic = 'force-dynamic'


type CocktailRow = {
  id: string
  slug: string
  name: string
  category: string | null
  spirit_base: string | null
  glass_type: string | null
  orb_from: string | null
  orb_to: string | null
  image_url: string | null
  featured: boolean
  menu_price_cents: number | null
  cost_cents: number | null
  created_at: string | null
  updated_at: string | null
  creators: { id: string; name: string; city: string | null; role: string | null } | null
  global_products: { brand: string; expression: string } | null
}

type CreatorRow = {
  id: string
  name: string
  role: string | null
  city: string | null
}

function dollars(cents: number | null): string {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

export default async function DashboardPage() {
  const workspace = await getCurrentWorkspace()
  const user = await getUser()
  const supabase = await createClient()

  const [{ data: profile }, { data: cocktailsData }, { data: creatorsData }, productsCount, ingredientsCount] =
    await Promise.all([
      user
        ? supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('cocktails')
        .select(
          'id, slug, name, category, spirit_base, glass_type, orb_from, orb_to, image_url, featured, menu_price_cents, cost_cents, created_at, updated_at, creators(id, name, city, role), global_products(brand, expression)',
        )
        .eq('workspace_id', workspace.id)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase
        .from('creators')
        .select('id, name, role, city')
        .eq('workspace_id', workspace.id),
      supabase
        .from('workspace_products')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id),
      supabase
        .from('workspace_ingredients')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id),
    ])

  const cocktails = (cocktailsData ?? []) as unknown as CocktailRow[]
  const creators = (creatorsData ?? []) as unknown as CreatorRow[]

  const fullName =
    ((profile as { full_name: string | null } | null)?.full_name ?? user?.email ?? 'there').split(
      ' ',
    )[0] ?? 'there'
  const kicker = `${seasonLabel()} Collection · Week ${isoWeek()}, ${new Date().getFullYear()}`

  // ── Stats
  const pricedCocktails = cocktails.filter(
    (c) => typeof c.menu_price_cents === 'number' && c.menu_price_cents > 0,
  )
  const avgPriceCents =
    pricedCocktails.length > 0
      ? pricedCocktails.reduce((s, c) => s + (c.menu_price_cents ?? 0), 0) / pricedCocktails.length
      : null
  const pricedWithCost = cocktails.filter(
    (c) => typeof c.cost_cents === 'number' && c.cost_cents > 0,
  )
  const avgCostCents =
    pricedWithCost.length > 0
      ? pricedWithCost.reduce((s, c) => s + (c.cost_cents ?? 0), 0) / pricedWithCost.length
      : null

  const venues = new Set(
    creators.map((c) => c.city ?? '').filter((x) => x.length > 0),
  )

  // Mono-spirit workspaces should surface the expression (Blanco, Reposado…)
  // rather than the generic spirit category (Tequila).
  const distinctSpirits = new Set(
    cocktails.map((c) => c.spirit_base ?? '').filter((x) => x.length > 0),
  )
  const distinctProducts = new Set(
    cocktails.map((c) => c.global_products?.expression ?? '').filter((x) => x.length > 0),
  )
  const monoSpirit = distinctSpirits.size <= 1 && distinctProducts.size >= 2
  const spiritLabel = (c: CocktailRow) =>
    monoSpirit
      ? c.global_products?.expression ?? c.spirit_base
      : c.spirit_base

  // ── Featured — flagged first, fall back to most recent
  const featured = cocktails.filter((c) => c.featured).slice(0, 4)
  const featuredFallback =
    featured.length >= 4
      ? featured
      : [
          ...featured,
          ...cocktails.filter((c) => !c.featured).slice(0, 4 - featured.length),
        ]

  // ── Recently updated (top 5)
  const recent = cocktails.slice(0, 5)

  // ── Spirit (or product, for mono-spirit workspaces) breakdown
  const bySpirit = new Map<string, number>()
  for (const c of cocktails) {
    const key = monoSpirit
      ? c.global_products?.expression ?? c.spirit_base
      : c.spirit_base
    if (!key) continue
    bySpirit.set(key, (bySpirit.get(key) ?? 0) + 1)
  }
  const spiritEntries = [...bySpirit.entries()].sort((a, b) => b[1] - a[1])

  // ── Top contributors (creators with the most cocktails)
  const countByCreator = new Map<string, number>()
  for (const c of cocktails) {
    if (!c.creators?.id) continue
    countByCreator.set(c.creators.id, (countByCreator.get(c.creators.id) ?? 0) + 1)
  }
  const topCreators = creators
    .map((cr) => ({ ...cr, count: countByCreator.get(cr.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  // Updated yesterday count for the subtitle
  const yesterday = Math.floor(
    cocktails.filter((c) => {
      if (!c.updated_at) return false
      const diffDays = (Date.now() - new Date(c.updated_at).getTime()) / 86400000
      return diffDays >= 1 && diffDays < 2
    }).length,
  )

  // ── Empty state
  if (cocktails.length === 0 && creators.length === 0) {
    return (
      <div className="page">
        <Reveal className="page-head" distance={14}>
          <div className="page-kicker">{kicker}</div>
          <h1 className="page-title">
            {greeting()}, {fullName}.
          </h1>
          <p className="page-sub">
            Your {workspace.name} workspace is empty. Add a cocktail, a creator, or a bottle to get
            started — everything else plugs in from there.
          </p>
        </Reveal>
        <Reveal
          delay={0.05}
          distance={14}
          className="card card-pad dash-empty"
        >
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <DrinkOrb from="#ffd9c2" to="#f58a6e" size={120} ring />
          </div>
          <div className="col" style={{ gap: 10 }}>
            <div className="page-kicker">Get started</div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 30,
                letterSpacing: '-0.01em',
              }}
            >
              Set up your first cocktail.
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', maxWidth: '54ch' }}>
              Add a bottle from the shared catalog, create a cocktail, credit a bartender. Three
              steps to a workable program.
            </p>
            <div className="row gap-sm" style={{ marginTop: 8 }}>
              <Link href="/cocktails/new" className="btn-primary">
                <Icon name="plus" size={13} />
                New cocktail
              </Link>
              <Link href="/products/new" className="btn-secondary">
                Browse catalog
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    )
  }

  return (
    <div className="page">
      <Reveal className="page-head" distance={14}>
        <div className="page-kicker">{kicker}</div>
        <h1 className="page-title" style={{ textWrap: 'balance' }}>
          {greeting()}, {fullName}.
        </h1>
        <p className="page-sub">
          {cocktails.length} cocktail{cocktails.length === 1 ? '' : 's'} in active rotation across{' '}
          {creators.length} creator{creators.length === 1 ? '' : 's'}
          {venues.size > 0 ? ` and ${venues.size} ${venues.size === 1 ? 'city' : 'cities'}` : ''}.
          {yesterday > 0
            ? ` ${yesterday} spec${yesterday === 1 ? ' was' : 's were'} updated yesterday.`
            : ''}
        </p>
      </Reveal>

      {/* Hero stat row — wrap whole grid, not each card, to preserve equal heights. */}
      <Reveal
        delay={0.05}
        distance={14}
        className="dash-stats"
      >
        <StatCard
          kicker="Active Cocktails"
          value={cocktails.length}
          sub={`${cocktails.filter((c) => c.featured).length} featured`}
        />
        <StatCard
          kicker="Avg. Menu Price"
          value={avgPriceCents != null ? dollars(Math.round(avgPriceCents)) : '—'}
          sub={
            avgPriceCents != null
              ? `${pricedCocktails.length} priced spec${pricedCocktails.length === 1 ? '' : 's'}`
              : 'Add menu prices'
          }
        />
        <StatCard
          kicker="Creators"
          value={creators.length}
          sub={`${topCreators[0]?.name ?? '—'} leads`}
          accent
        />
        <StatCard
          kicker="Avg. Cost / Drink"
          value={avgCostCents != null ? dollars(Math.round(avgCostCents)) : '—'}
          sub={avgCostCents != null ? `${pricedWithCost.length} with cost` : 'Set cost to see'}
        />
      </Reveal>

      {/* Featured row */}
      {featuredFallback.length > 0 && (
        <Reveal style={{ marginTop: 36 }} distance={18} amount={0.1}>
          <SectionHead
            kicker={featured.length > 0 ? 'Featured' : 'Recent'}
            title={
              featured.length > 0
                ? 'Spotlight specs this season'
                : 'Your latest cocktails'
            }
            action={
              <Link href="/cocktails" className="btn-ghost">
                View all <Icon name="chevron-r" size={12} />
              </Link>
            }
          />
          <div className="dash-featured">
            {featuredFallback.map((c) => (
              <Link
                key={c.id}
                href={`/cocktails/${c.id}`}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '4 / 5',
                    background: c.image_url
                      ? '#f4efe0'
                      : `radial-gradient(120% 100% at 30% 30%, ${c.orb_from ?? '#f4efe0'}, ${c.orb_to ?? '#c9b89a'} 70%)`,
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <DrinkOrb
                      from={c.orb_from ?? '#f4efe0'}
                      to={c.orb_to ?? '#c9b89a'}
                      size={120}
                      ring
                    />
                  )}
                  {c.featured && (
                    <span
                      className="pill"
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Icon name="star" size={11} />
                      Featured
                    </span>
                  )}
                </div>
                <div style={{ padding: 18 }}>
                  <div
                    className="row"
                    style={{ justifyContent: 'space-between', marginBottom: 4 }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        color: 'var(--ink-4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {[spiritLabel(c), c.category].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: 20,
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      marginBottom: 6,
                    }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {c.creators?.name
                      ? `${c.creators.name}${c.creators.city ? ` · ${c.creators.city}` : ''}`
                      : 'Unattributed'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {/* Recently updated + Spirits */}
      <Reveal
        distance={18}
        amount={0.1}
        className="dash-split"
      >
        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead kicker="Activity" title="Recently updated" />
          {recent.length === 0 ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '24px 0' }}>
              No cocktails yet.
            </div>
          ) : (
            recent.map((c, i) => (
              <Link
                key={c.id}
                href={`/cocktails/${c.id}`}
                className="row"
                style={{
                  gap: 12,
                  padding: '12px 0',
                  borderTop: i ? '1px solid var(--line-2)' : 'none',
                }}
              >
                <DrinkOrb
                  from={c.orb_from ?? '#f4efe0'}
                  to={c.orb_to ?? '#c9b89a'}
                  size={36}
                />
                <div className="col" style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>
                    {c.creators?.name
                      ? `Updated · ${c.creators.name}`
                      : [spiritLabel(c), c.category].filter(Boolean).join(' · ') || '—'}
                  </span>
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 10.5, color: 'var(--ink-4)', alignSelf: 'center' }}
                >
                  {relTime(c.updated_at)}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead
            kicker={monoSpirit ? 'By product' : 'By spirit'}
            title="Library composition"
          />
          {spiritEntries.length === 0 ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '24px 0' }}>
              {monoSpirit
                ? 'No product data yet. Attach a base product to your cocktails.'
                : 'No spirit data yet. Set a base spirit on your cocktails.'}
            </div>
          ) : (
            spiritEntries.map(([spirit, n], i) => (
              <BarRow
                key={spirit}
                label={spirit}
                value={n}
                max={cocktails.length}
                accent={i === 0}
              />
            ))
          )}
        </div>
      </Reveal>

      {/* Top contributors */}
      {creators.length > 0 && (
        <Reveal style={{ marginTop: 36 }} distance={18} amount={0.1}>
          <SectionHead
            kicker="People"
            title="Top contributors"
            action={
              <Link href="/creators" className="btn-ghost">
                All creators <Icon name="chevron-r" size={12} />
              </Link>
            }
          />
          <div
            className="dash-contributors"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {topCreators.map((cr) => (
              <Link
                key={cr.id}
                href={`/creators/${cr.id}`}
                className="row"
                style={{
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  border: '1px solid var(--line-2)',
                  background: 'var(--bg-sunken)',
                  textAlign: 'left',
                }}
              >
                <Avatar name={cr.name} size={40} />
                <div className="col" style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{cr.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>
                    {[cr.role, cr.city].filter(Boolean).join(' · ') || '—'}
                  </span>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--accent-ink)', alignSelf: 'flex-end' }}
                >
                  {cr.count} spec{cr.count === 1 ? '' : 's'}
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  )
}
