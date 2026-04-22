import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { Icon } from '@/components/icons'
import {
  CocktailCard,
  type CocktailCardData,
  type CollectionOption,
} from '@/components/cocktail/CocktailCard'
import { isUuid, slugifyIngredient } from '@/lib/ingredient-slug'

type Props = { params: Promise<{ id: string }> }

type IngredientMeta = {
  displayName: string
  category: string | null
  default_unit: string | null
  kind: 'global' | 'workspace' | 'custom'
  allergens?: string[] | null
}

type IngredientJoinRow = {
  custom_name: string | null
  global_ingredient_id: string | null
  workspace_ingredient_id: string | null
  global_ingredients: { id: string; name: string; category: string | null } | null
  workspace_ingredients: { id: string; name: string; category: string | null } | null
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
    status: string
    workspace_id: string
    creators: { name: string } | null
    global_products: { brand: string; expression: string } | null
  } | null
}

export default async function IngredientDetailPage({ params }: Props) {
  const { id } = await params
  const workspace = await getCurrentWorkspace()
  const user = await getUser()
  const supabase = await createClient()

  // 1. Resolve the ingredient meta (name, category) from the URL id.
  //    - If it's a UUID: look up global first, then workspace.
  //    - Else: treat as slug; derive a display name + scan usage rows to
  //      compute a canonical display and category.
  let meta: IngredientMeta | null = null
  let targetSlug: string | null = null

  if (isUuid(id)) {
    const { data: globalRow } = await supabase
      .from('global_ingredients')
      .select('id, name, category, default_unit, allergens')
      .eq('id', id)
      .maybeSingle()
    if (globalRow) {
      const g = globalRow as {
        id: string
        name: string
        category: string | null
        default_unit: string | null
        allergens: string[] | null
      }
      meta = {
        displayName: g.name,
        category: g.category,
        default_unit: g.default_unit,
        kind: 'global',
        allergens: g.allergens,
      }
      targetSlug = slugifyIngredient(g.name)
    } else {
      const { data: wsRow } = await supabase
        .from('workspace_ingredients')
        .select('id, name, category, default_unit, workspace_id')
        .eq('id', id)
        .eq('workspace_id', workspace.id)
        .maybeSingle()
      if (wsRow) {
        const w = wsRow as {
          id: string
          name: string
          category: string | null
          default_unit: string | null
        }
        meta = {
          displayName: w.name,
          category: w.category,
          default_unit: w.default_unit,
          kind: 'workspace',
        }
        targetSlug = slugifyIngredient(w.name)
      }
    }
  } else {
    targetSlug = id
  }

  // 2. Pull all cocktail_ingredients for this workspace, keep rows whose
  //    normalized display-name matches the target slug.
  const { data: joinData } = await supabase
    .from('cocktail_ingredients')
    .select(
      'custom_name, global_ingredient_id, workspace_ingredient_id, global_ingredients(id, name, category), workspace_ingredients(id, name, category), cocktails!inner(id, slug, name, category, spirit_base, glass_type, orb_from, orb_to, image_url, status, workspace_id, creators(name), global_products(brand, expression))',
    )
    .eq('cocktails.workspace_id', workspace.id)
    .neq('cocktails.status', 'archived')

  const rows = (joinData ?? []) as unknown as IngredientJoinRow[]

  const matching: NonNullable<IngredientJoinRow['cocktails']>[] = []
  const seen = new Set<string>()
  let displayName = meta?.displayName ?? ''
  let category: string | null = meta?.category ?? null

  for (const r of rows) {
    if (!r.cocktails) continue
    const name =
      r.global_ingredients?.name ??
      r.workspace_ingredients?.name ??
      r.custom_name ??
      null
    if (!name) continue
    const rowSlug = slugifyIngredient(name)
    if (rowSlug !== targetSlug) continue

    if (!displayName) displayName = name.trim()
    if (!category) {
      category =
        r.global_ingredients?.category ?? r.workspace_ingredients?.category ?? null
    }
    if (!seen.has(r.cocktails.id)) {
      seen.add(r.cocktails.id)
      matching.push(r.cocktails)
    }
  }

  if (!meta && matching.length === 0) notFound()
  if (!meta) {
    meta = {
      displayName: displayName || (id as string),
      category,
      default_unit: null,
      kind: 'custom',
    }
  }

  // 3. Load user favorites + collections for interactive cards
  const [{ data: favs }, { data: collections }, { data: colMembers }] = await Promise.all([
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

  const cards: CocktailCardData[] = matching.map((c) => ({
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

  const kindLabel =
    meta.kind === 'global'
      ? 'Shared catalog'
      : meta.kind === 'workspace'
        ? 'Workspace-only'
        : 'Used in your library'

  const metaBits: string[] = []
  if (meta.category) metaBits.push(meta.category)
  if (meta.default_unit) metaBits.push(`default ${meta.default_unit}`)
  if (meta.allergens && meta.allergens.length > 0) {
    metaBits.push(`allergens: ${meta.allergens.join(', ')}`)
  }

  return (
    <div className="page fade-up">
      <Link href="/ingredients" className="btn-ghost" style={{ marginBottom: 18 }}>
        <Icon name="chevron-l" size={12} />
        All ingredients
      </Link>

      <div className="page-head">
        <div className="page-kicker">
          {kindLabel} · used in {cards.length}{' '}
          {cards.length === 1 ? 'cocktail' : 'cocktails'}
        </div>
        <h1 className="page-title" style={{ textWrap: 'balance' }}>
          {meta.displayName}.
        </h1>
        {metaBits.length > 0 && <p className="page-sub">{metaBits.join(' · ')}</p>}
      </div>

      {cards.length === 0 ? (
        <div
          className="card card-pad"
          style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)' }}
        >
          <div style={{ fontSize: 14, marginBottom: 10 }}>
            No cocktails use this ingredient yet.
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-4)', margin: 0, marginBottom: 16 }}>
            Add it to a cocktail from its edit page.
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
            <CocktailCard key={c.id} c={c} allCollections={allCollections} />
          ))}
        </div>
      )}
    </div>
  )
}
