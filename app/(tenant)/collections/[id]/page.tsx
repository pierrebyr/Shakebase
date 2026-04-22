import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { Icon } from '@/components/icons'
import { CollectionCover } from '@/components/cocktail/CollectionCover'
import {
  CocktailCard,
  type CocktailCardData,
  type CollectionOption,
} from '@/components/cocktail/CocktailCard'
import { relTime } from '@/lib/datetime'

type Props = { params: Promise<{ id: string }> }

type CollectionRow = {
  id: string
  name: string
  description: string | null
  cover_from: string
  cover_to: string
  pinned: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

type JoinRow = {
  cocktails: {
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
  } | null
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params
  const workspace = await getCurrentWorkspace()
  const user = await getUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('collections')
    .select(
      'id, name, description, cover_from, cover_to, pinned, created_at, updated_at, created_by',
    )
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const collection = data as CollectionRow | null
  if (!collection) notFound()

  const [
    { data: joinData },
    { data: favs },
    { data: collections },
    { data: colMembers },
  ] = await Promise.all([
    supabase
      .from('collection_cocktails')
      .select(
        'cocktails(id, slug, name, category, spirit_base, glass_type, orb_from, orb_to, image_url, creators(name), global_products(brand, expression))',
      )
      .eq('collection_id', id)
      .order('position', { ascending: true })
      .order('added_at', { ascending: false }),
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

  const items = ((joinData ?? []) as unknown as JoinRow[])
    .map((r) => r.cocktails)
    .filter((c): c is NonNullable<JoinRow['cocktails']> => c != null)

  const favoriteIds = new Set(
    ((favs ?? []) as { cocktail_id: string }[]).map((r) => r.cocktail_id),
  )

  const membershipByCocktail = new Map<string, Set<string>>()
  for (const row of ((colMembers ?? []) as { collection_id: string; cocktail_id: string }[])) {
    const set = membershipByCocktail.get(row.cocktail_id) ?? new Set<string>()
    set.add(row.collection_id)
    membershipByCocktail.set(row.cocktail_id, set)
  }

  type ColRow = {
    id: string
    name: string
    cover_from: string
    cover_to: string
    pinned: boolean
    collection_cocktails: { cocktail_id: string }[]
  }
  const allCollections: CollectionOption[] = ((collections ?? []) as unknown as ColRow[]).map(
    (c) => ({
      id: c.id,
      name: c.name,
      cover_from: c.cover_from,
      cover_to: c.cover_to,
      pinned: c.pinned,
      count: c.collection_cocktails?.length ?? 0,
    }),
  )

  const cards: CocktailCardData[] = items.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    category: c.category,
    spirit_base: c.spirit_base,
    glass_type: c.glass_type,
    orb_from: c.orb_from,
    orb_to: c.orb_to,
    image_url: c.image_url,
    creator_name: c.creators?.name ?? null,
    base_product_expression: c.global_products?.expression ?? null,
    base_product_brand: c.global_products?.brand ?? null,
    is_favorite: favoriteIds.has(c.id),
    collection_ids: [...(membershipByCocktail.get(c.id) ?? [])],
  }))

  const orbs = items.map((c) => ({
    from: c.orb_from ?? '#f4efe0',
    to: c.orb_to ?? '#c9b89a',
  }))

  const canEdit =
    Boolean(user) &&
    (collection.created_by === user!.id || workspace.owner_user_id === user!.id)

  // Resolve owner name
  let ownerName: string | null = null
  if (collection.created_by) {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any
    const { data: profile } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', collection.created_by)
      .maybeSingle()
    ownerName = (profile as { full_name: string | null } | null)?.full_name ?? null
  }

  return (
    <div className="page fade-up">
      <Link href="/collections" className="btn-ghost" style={{ marginBottom: 18 }}>
        <Icon name="chevron-l" size={12} />
        All collections
      </Link>

      {/* Hero — design: bg-sunken wrapper, 240px cover + 1fr content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: 28,
          padding: 20,
          marginBottom: 28,
          background: 'var(--bg-sunken)',
          borderRadius: 16,
          border: '1px solid var(--line-1)',
          alignItems: 'stretch',
        }}
        className="collection-hero"
      >
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            alignSelf: 'stretch',
          }}
        >
          <CollectionCover
            from={collection.cover_from}
            to={collection.cover_to}
            orbs={orbs}
            height="fill"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="row gap-sm" style={{ marginBottom: 8 }}>
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--accent-ink)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Collection
            </span>
            {collection.pinned && (
              <span
                className="mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  color: 'var(--ink-4)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                <Icon name="pin" size={10} /> Pinned
              </span>
            )}
          </div>
          <h1
            className="page-title"
            style={{ marginBottom: 8, marginTop: 0, textWrap: 'balance' }}
          >
            {collection.name}
          </h1>
          {collection.description && (
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: 'var(--ink-3)',
                maxWidth: '60ch',
                lineHeight: 1.55,
              }}
            >
              {collection.description}
            </p>
          )}
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              rowGap: 10,
            }}
          >
            <div className="row gap-sm" style={{ flexWrap: 'wrap', rowGap: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                {items.length} cocktail{items.length === 1 ? '' : 's'}
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                ·
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                Owned by {ownerName ?? 'Workspace'}
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                ·
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                Updated {relTime(collection.updated_at)}
              </span>
            </div>
            {canEdit && (
              <Link
                href={`/collections/${collection.id}/edit`}
                className="btn-secondary"
                style={{ marginLeft: 'auto' }}
              >
                <Icon name="edit" size={13} />
                Edit
              </Link>
            )}
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div
          className="card card-pad"
          style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)' }}
        >
          <div style={{ fontSize: 14, marginBottom: 10 }}>No cocktails in this collection yet.</div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-4)', margin: 0, marginBottom: 16 }}>
            Open a cocktail and use the collection button to drop it in here.
          </p>
          <Link href="/cocktails" className="btn-secondary">
            Browse cocktails
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--density-gap)',
          }}
        >
          {cards.map((c) => (
            <CocktailCard
              key={c.id}
              c={c}
              allCollections={allCollections}
              removeFromCollectionId={collection.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
