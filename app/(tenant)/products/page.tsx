import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/icons'
import { ProductsDashboard, type Product, type UsedInCocktail } from './ProductsDashboard'

type WorkspaceRow = {
  id: string
  stock: number | null
  par: number | null
  cost_cents: number | null
  menu_price_cents: number | null
  global_products: {
    id: string
    brand: string
    expression: string
    category: string
    abv: number | null
    origin: string | null
    description: string | null
    tagline: string | null
    tasting_notes: string | null
    volume_ml: number | null
    color_hex: string | null
    image_url: string | null
    provenance: Record<string, string> | null
  } | null
}

type CocktailRow = {
  id: string
  slug: string
  name: string
  category: string | null
  venue: string | null
  orb_from: string | null
  orb_to: string | null
  cocktail_ingredients: { global_product_id: string | null }[] | null
}

export default async function ProductsPage() {
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const { data } = await supabase
    .from('workspace_products')
    .select(
      'id, stock, par, cost_cents, menu_price_cents, global_products(id, brand, expression, category, abv, origin, description, tagline, tasting_notes, volume_ml, color_hex, image_url, provenance)',
    )
    .eq('workspace_id', workspace.id)

  const rows = ((data ?? []) as unknown as WorkspaceRow[]).filter((r) => r.global_products != null)

  if (rows.length === 0) {
    return (
      <div className="page fade-up">
        <div className="page-head">
          <div className="page-kicker">Bottle catalog</div>
          <h1 className="page-title">The portfolio.</h1>
          <p className="page-sub">Add bottles from the shared catalog to see them here.</p>
        </div>
        <EmptyState
          kicker="No bottles yet"
          title="Add your first product."
          description="Pick from the shared catalog — Casa Dragones, Patrón, Del Maguey and more are there."
          ctaLabel="Browse catalog"
          ctaHref="/products/new"
        />
      </div>
    )
  }

  // Pull all cocktails with their product ingredient joins so we can compute usedIn per bottle
  const { data: cocktailsData } = await supabase
    .from('cocktails')
    .select(
      'id, slug, name, category, venue, orb_from, orb_to, cocktail_ingredients(global_product_id)',
    )
    .eq('workspace_id', workspace.id)
    .neq('status', 'archived')

  const cocktailsByProductId = new Map<string, UsedInCocktail[]>()
  for (const c of (cocktailsData ?? []) as unknown as CocktailRow[]) {
    const productIds = new Set(
      (c.cocktail_ingredients ?? [])
        .map((i) => i.global_product_id)
        .filter((id): id is string => Boolean(id)),
    )
    for (const pid of productIds) {
      const list = cocktailsByProductId.get(pid) ?? []
      list.push({
        id: c.id,
        slug: c.slug,
        name: c.name,
        category: c.category,
        venue: c.venue,
        orb_from: c.orb_from,
        orb_to: c.orb_to,
      })
      cocktailsByProductId.set(pid, list)
    }
  }

  // Sort Casa Dragones by a fixed portfolio order, then by expression alphabetic
  const CD_ORDER = ['Joven', 'Blanco', 'Reposado Mizunara', 'Añejo Barrel Blend', 'Blanco Cask-Strength']
  const sorted = [...rows].sort((a, b) => {
    const aGP = a.global_products!
    const bGP = b.global_products!
    if (aGP.brand === 'Casa Dragones' && bGP.brand === 'Casa Dragones') {
      return CD_ORDER.indexOf(aGP.expression) - CD_ORDER.indexOf(bGP.expression)
    }
    if (aGP.brand !== bGP.brand) return aGP.brand.localeCompare(bGP.brand)
    return aGP.expression.localeCompare(bGP.expression)
  })

  const products: Product[] = sorted.map((r) => {
    const g = r.global_products!
    return {
      id: r.id,
      global_product_id: g.id,
      brand: g.brand,
      expression: g.expression,
      category: g.category,
      // Short "type" pill — just the category. Descriptions are shown
      // in the dedicated Tasting notes panel, not here.
      type: g.category,
      abv: g.abv,
      origin: g.origin,
      volume_ml: g.volume_ml ?? 750,
      stock: r.stock,
      par: r.par,
      cost_cents: r.cost_cents,
      menu_price_cents: r.menu_price_cents,
      color_hex: g.color_hex ?? '#efe6c9',
      image_url: g.image_url,
      tagline: g.tagline,
      tasting_notes: g.tasting_notes ?? g.description,
      provenance: g.provenance,
      used_in: cocktailsByProductId.get(g.id) ?? [],
    }
  })

  // Portfolio stats
  const totalStock = products.reduce((s, p) => s + (p.stock ?? 0), 0)
  const totalValueCents = products.reduce(
    (s, p) => s + (p.stock ?? 0) * (p.cost_cents ?? 0),
    0,
  )
  const lowCount = products.filter((p) => p.par != null && (p.stock ?? 0) < p.par).length

  // Determine kicker: if all products share a brand, feature it
  const brands = new Set(products.map((p) => p.brand))
  const kicker =
    brands.size === 1
      ? `${[...brands][0]} · ${products.length} expression${products.length === 1 ? '' : 's'}`
      : `${products.length} bottles · ${brands.size} brands`

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}
        >
          <div>
            <div className="page-kicker">{kicker}</div>
            <h1 className="page-title">The portfolio.</h1>
            <p className="page-sub">
              {brands.size === 1
                ? `${[...brands][0]} bottles in ${workspace.name}. Select one to view its spec, provenance, and the cocktails it powers.`
                : `Bottles available across ${workspace.name}. Select one to view specs, provenance, and linked cocktails.`}
            </p>
          </div>
          <Link href="/products/new" className="btn-secondary">
            <Icon name="plus" size={13} />
            Add from catalog
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="products-stats" style={{ marginBottom: 32 }}>
        <Stat kicker="Expressions" value={products.length} sub="In the portfolio" />
        <Stat kicker="Bottles on hand" value={totalStock} sub="Across categories" accent />
        <Stat kicker="Below par" value={lowCount} sub="Need reordering" />
        <Stat
          kicker="Inventory value"
          value={`$${(totalValueCents / 100 / 1000).toFixed(1)}k`}
          sub="Cost basis · on hand"
        />
      </div>

      <ProductsDashboard products={products} />
    </div>
  )
}

function Stat({
  kicker,
  value,
  sub,
  accent,
}: {
  kicker: string
  value: number | string
  sub: string
  accent?: boolean
}) {
  return (
    <div
      className="card card-pad fade-up"
      style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 22, minHeight: 120 }}
    >
      <div className="panel-title">{kicker}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 40,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: accent ? 'var(--accent-ink)' : 'var(--ink-1)',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{sub}</div>
    </div>
  )
}
