import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { Icon } from '@/components/icons'
import { CocktailCard, type CocktailCardData } from '@/components/cocktail/CocktailCard'

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
  creators: { name: string } | null
  global_products: { brand: string; expression: string } | null
}

export default async function FavoritesPage() {
  const workspace = await getCurrentWorkspace()
  const user = await getUser()
  const supabase = await createClient()

  if (!user) {
    return (
      <div className="page">
        <p>Sign in to see your favorites.</p>
      </div>
    )
  }

  const { data: favRows } = await supabase
    .from('user_cocktail_favorites')
    .select('cocktail_id, created_at')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  const favIds = ((favRows ?? []) as { cocktail_id: string; created_at: string }[]).map(
    (r) => r.cocktail_id,
  )

  const [{ data: cocktailData }, { data: collections }, { data: colMembers }] =
    await Promise.all([
      favIds.length
        ? supabase
            .from('cocktails')
            .select(
              'id, slug, name, category, spirit_base, glass_type, orb_from, orb_to, image_url, creators(name), global_products(brand, expression)',
            )
            .eq('workspace_id', workspace.id)
            .neq('status', 'archived')
            .in('id', favIds)
        : Promise.resolve({ data: [] as Row[] }),
      supabase
        .from('collections')
        .select('id, name, cover_from, cover_to, pinned, collection_cocktails(cocktail_id)')
        .eq('workspace_id', workspace.id)
        .order('pinned', { ascending: false })
        .order('name', { ascending: true }),
      favIds.length
        ? supabase
            .from('collection_cocktails')
            .select('collection_id, cocktail_id, collections!inner(workspace_id)')
            .eq('collections.workspace_id', workspace.id)
            .in('cocktail_id', favIds)
        : Promise.resolve({ data: [] as { collection_id: string; cocktail_id: string }[] }),
    ])

  const byId = new Map<string, Row>()
  for (const r of ((cocktailData ?? []) as unknown as Row[])) byId.set(r.id, r)

  const membershipByCocktail = new Map<string, Set<string>>()
  for (const row of ((colMembers ?? []) as { collection_id: string; cocktail_id: string }[])) {
    const set = membershipByCocktail.get(row.cocktail_id) ?? new Set<string>()
    set.add(row.collection_id)
    membershipByCocktail.set(row.cocktail_id, set)
  }

  // Preserve favorite order (most-recently added first)
  const cocktails: CocktailCardData[] = favIds
    .map((id) => byId.get(id))
    .filter((r): r is Row => Boolean(r))
    .map((r) => ({
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
      is_favorite: true,
      collection_ids: [...(membershipByCocktail.get(r.id) ?? [])],
    }))

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

  if (cocktails.length === 0) {
    return (
      <div className="page fade-up">
        <div className="page-head">
          <div className="page-kicker">Your favorites</div>
          <h1 className="page-title">No saved cocktails yet.</h1>
          <p className="page-sub">
            Tap the heart on any cocktail card to save it here — a private shortlist just for you.
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: 56,
            textAlign: 'center',
            background: 'linear-gradient(180deg, #fff, var(--bg-sunken))',
            border: '1.5px dashed var(--line-1)',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 999,
              background: 'rgba(224,88,88,0.08)',
              color: '#e05858',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Icon name="heart-filled" size={40} />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontStyle: 'italic',
              marginBottom: 8,
            }}
          >
            Your personal shortlist
          </div>
          <p
            style={{
              fontSize: 14,
              color: 'var(--ink-3)',
              maxWidth: '42ch',
              margin: '0 auto 24px',
              lineHeight: 1.55,
            }}
          >
            Favorites are private to you — unlike Collections, which are shared with the team. Use
            them as a quick-access menu for the cocktails you reach for most.
          </p>
          <Link href="/cocktails" className="btn-primary">
            <Icon name="cup" size={13} /> Browse the library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div className="page-kicker">
          {cocktails.length} saved · private to you
        </div>
        <h1 className="page-title">Favorites.</h1>
        <p className="page-sub">
          A quick-access shortlist of your most-reached-for specs. Tap a heart anywhere to add or
          remove.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--density-gap)',
        }}
      >
        {cocktails.map((c) => (
          <CocktailCard key={c.id} c={c} allCollections={allCollections} />
        ))}
      </div>

    </div>
  )
}
