import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { EmptyState } from '@/components/EmptyState'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import { Icon } from '@/components/icons'
import { LibraryBrowser, type LibraryCocktail } from './LibraryBrowser'

type Row = {
  id: string
  slug: string
  name: string
  category: string | null
  spirit_base: string | null
  glass_type: string | null
  orb_from: string | null
  orb_to: string | null
  image_url: string | null
  season: string[] | null
  occasions: string[] | null
  flavor_profile: string[] | null
  menu_price_cents: number | null
  created_at: string | null
  updated_at: string | null
  creators: { name: string } | null
  global_products: { brand: string; expression: string } | null
}

export default async function CocktailsLibraryPage() {
  const workspace = await getCurrentWorkspace()
  const user = await getUser()
  const supabase = await createClient()

  const [{ data }, { data: favs }, { data: collections }, { data: colMembers }] =
    await Promise.all([
      supabase
        .from('cocktails')
        .select(
          'id, slug, name, category, spirit_base, glass_type, orb_from, orb_to, image_url, season, occasions, flavor_profile, menu_price_cents, created_at, updated_at, creators(name), global_products(brand, expression)',
        )
        .eq('workspace_id', workspace.id)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false })
        .limit(1000),
      user
        ? supabase
            .from('user_cocktail_favorites')
            .select('cocktail_id')
            .eq('user_id', user.id)
            .eq('workspace_id', workspace.id)
        : Promise.resolve({ data: [] as { cocktail_id: string }[] }),
      supabase
        .from('collections')
        .select('id, name, cover_from, cover_to, pinned, collection_cocktails(cocktail_id)')
        .eq('workspace_id', workspace.id)
        .order('pinned', { ascending: false })
        .order('name', { ascending: true }),
      supabase
        .from('collection_cocktails')
        .select('collection_id, cocktail_id, collections!inner(workspace_id)')
        .eq('collections.workspace_id', workspace.id),
    ])

  const favoriteIds = new Set(
    ((favs ?? []) as { cocktail_id: string }[]).map((r) => r.cocktail_id),
  )
  type ColRow = {
    id: string
    name: string
    cover_from: string
    cover_to: string
    pinned: boolean
    collection_cocktails: { cocktail_id: string }[]
  }
  const allCollections = ((collections ?? []) as unknown as ColRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    cover_from: c.cover_from,
    cover_to: c.cover_to,
    pinned: c.pinned,
    count: c.collection_cocktails?.length ?? 0,
  }))
  const membershipByCocktail = new Map<string, Set<string>>()
  for (const row of ((colMembers ?? []) as { collection_id: string; cocktail_id: string }[])) {
    const set = membershipByCocktail.get(row.cocktail_id) ?? new Set<string>()
    set.add(row.collection_id)
    membershipByCocktail.set(row.cocktail_id, set)
  }

  const cocktails: LibraryCocktail[] = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    spirit_base: r.spirit_base,
    glass_type: r.glass_type,
    orb_from: r.orb_from,
    orb_to: r.orb_to,
    image_url: r.image_url,
    creator_name: r.creators?.name ?? null,
    base_product_expression: r.global_products?.expression ?? null,
    base_product_brand: r.global_products?.brand ?? null,
    season: r.season ?? [],
    occasions: r.occasions ?? [],
    flavor_profile: r.flavor_profile ?? [],
    menu_price_cents: r.menu_price_cents,
    created_at: r.created_at,
    updated_at: r.updated_at,
    is_favorite: favoriteIds.has(r.id),
    collection_ids: [...(membershipByCocktail.get(r.id) ?? [])],
  }))

  return (
    <div className="page fade-up">
      <div
        className="page-head"
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}
      >
        <div>
          <div className="page-kicker">
            {cocktails.length} {cocktails.length === 1 ? 'specification' : 'specifications'}
          </div>
          <h1 className="page-title" style={{ textWrap: 'balance' }}>
            The library.
          </h1>
          <p className="page-sub">
            Every cocktail in active rotation across {workspace.name}, with full specs, costs, and
            provenance. Filter by spirit, season, or occasion — or search by flavor.
          </p>
        </div>
        <Link href="/cocktails/new" className="btn-primary">
          <Icon name="plus" size={14} />
          New cocktail
        </Link>
      </div>

      {cocktails.length === 0 ? (
        <EmptyState
          illustration={<DrinkOrb from="#ffd9c2" to="#f58a6e" size={72} ring />}
          kicker="Empty library"
          title="Your first cocktail."
          description="Name it, pick a spirit, drop a tasting note. Ingredients, method, and creator can follow."
          ctaLabel="Create a cocktail"
          ctaHref="/cocktails/new"
        />
      ) : (
        <LibraryBrowser cocktails={cocktails} allCollections={allCollections} />
      )}
    </div>
  )
}
