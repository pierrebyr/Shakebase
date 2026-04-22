import Link from 'next/link'
import { slugifyIngredient } from '@/lib/ingredient-slug'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import { CocktailGallery } from '@/components/cocktail/CocktailGallery'
import { GlassIcon } from '@/components/cocktail/GlassIcon'
import { Avatar } from '@/components/cocktail/Avatar'
import { CollectionPicker } from '@/components/cocktail/CollectionPicker'
import { CopyRecipeButton } from '@/components/cocktail/CopyRecipeButton'
import { Icon } from '@/components/icons'
import {
  findSimilar,
  ingredientKey,
  type SimilarCandidate,
} from '@/lib/cocktail/similar'

type Props = { params: Promise<{ id: string }> }

type CocktailRow = {
  id: string
  slug: string
  name: string
  status: string
  category: string | null
  spirit_base: string | null
  glass_type: string | null
  garnish: string | null
  tasting_notes: string | null
  flavor_profile: string[] | null
  orb_from: string | null
  orb_to: string | null
  venue: string | null
  event_origin: string | null
  image_url: string | null
  images: string[] | null
  created_at: string | null
  updated_at: string | null
  method_steps: unknown
  creators: {
    id: string
    name: string
    venue: string | null
    bio: string | null
    photo_url: string | null
  } | null
  global_products: { brand: string; expression: string } | null
}

type IngredientJoin = {
  id: string
  position: number
  amount: number | null
  unit: string | null
  amount_text: string | null
  notes: string | null
  custom_name: string | null
  global_ingredient_id: string | null
  workspace_ingredient_id: string | null
  global_ingredients: { id: string; name: string } | null
  global_products: { id: string; brand: string; expression: string } | null
  workspace_ingredients: { id: string; name: string } | null
}

// UUID shape — used to detect legacy /cocktails/{uuid} URLs and permanently
// redirect them to the canonical /cocktails/{slug} form.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function CocktailDetailPage({ params }: Props) {
  const { id: param } = await params
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  // Backwards compat: the route is now slug-based. A UUID in the URL means an
  // old link — look up the cocktail and redirect to the slug URL.
  if (UUID_RE.test(param)) {
    const { data: found } = await supabase
      .from('cocktails')
      .select('slug')
      .eq('id', param)
      .eq('workspace_id', workspace.id)
      .maybeSingle()
    const slug = (found as { slug: string } | null)?.slug
    if (!slug) notFound()
    redirect(`/cocktails/${slug}`)
  }

  const { data: cocktailData } = await supabase
    .from('cocktails')
    .select(
      'id, slug, name, status, category, spirit_base, glass_type, garnish, tasting_notes, flavor_profile, orb_from, orb_to, venue, event_origin, image_url, images, created_at, updated_at, method_steps, creators(id, name, venue, bio, photo_url), global_products(brand, expression)',
    )
    .eq('slug', param)
    .eq('workspace_id', workspace.id)
    .maybeSingle()

  const cocktail = cocktailData as unknown as CocktailRow | null
  if (!cocktail) notFound()
  const id = cocktail.id

  // Detect mono-spirit workspaces (e.g. Casa Dragones — only tequila but multiple
  // expressions). In that case we surface the product expression (Blanco, Añejo…)
  // rather than the generic spirit category.
  const { data: siblingRows } = await supabase
    .from('cocktails')
    .select('spirit_base, global_products(expression)')
    .eq('workspace_id', workspace.id)
    .neq('status', 'archived')
  const distinctSpirits = new Set(
    ((siblingRows ?? []) as unknown as { spirit_base: string | null }[])
      .map((r) => r.spirit_base ?? '')
      .filter((x) => x.length > 0),
  )
  const distinctProducts = new Set(
    ((siblingRows ?? []) as unknown as { global_products: { expression: string } | null }[])
      .map((r) => r.global_products?.expression ?? '')
      .filter((x) => x.length > 0),
  )
  const monoSpirit = distinctSpirits.size <= 1 && distinctProducts.size >= 2
  const spiritLabel = monoSpirit
    ? cocktail.global_products?.expression ?? cocktail.spirit_base
    : cocktail.spirit_base

  const { data: ingredientsData } = await supabase
    .from('cocktail_ingredients')
    .select(
      'id, position, amount, unit, amount_text, notes, custom_name, global_ingredient_id, workspace_ingredient_id, global_ingredients(id, name), global_products(id, brand, expression), workspace_ingredients(id, name)',
    )
    .eq('cocktail_id', id)
    .order('position')

  const ingredients = (ingredientsData ?? []) as unknown as IngredientJoin[]
  const methodSteps = Array.isArray(cocktail.method_steps)
    ? (cocktail.method_steps as { step?: number; text?: string }[])
    : []

  // Collections for the picker: all workspace collections + which ones already contain this cocktail
  const [{ data: allCollectionsData }, { data: currentMembershipsData }] = await Promise.all([
    supabase
      .from('collections')
      .select('id, name, cover_from, cover_to')
      .eq('workspace_id', workspace.id)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false }),
    supabase
      .from('collection_cocktails')
      .select('collection_id')
      .eq('cocktail_id', id),
  ])
  const allCollections = (allCollectionsData ?? []) as unknown as {
    id: string
    name: string
    cover_from: string
    cover_to: string
  }[]
  const memberIds = ((currentMembershipsData ?? []) as unknown as { collection_id: string }[]).map(
    (r) => r.collection_id,
  )

  // Similar cocktails — pull every published cocktail in the workspace with
  // enough fields to score against the current one. This is one query + one
  // in-memory sort; even 2000 cocktails is fine here.
  type SiblingRow = {
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
    global_products: { expression: string } | null
    cocktail_ingredients: {
      global_ingredient_id: string | null
      workspace_ingredient_id: string | null
      global_product_id: string | null
      custom_name: string | null
    }[]
  }
  const { data: siblingsData } = await supabase
    .from('cocktails')
    .select(
      'id, slug, name, category, spirit_base, glass_type, orb_from, orb_to, image_url, creators(name), global_products(expression), cocktail_ingredients(global_ingredient_id, workspace_ingredient_id, global_product_id, custom_name)',
    )
    .eq('workspace_id', workspace.id)
    .neq('status', 'archived')
    .neq('id', id)
    .limit(500)
  const siblingRows2 = (siblingsData ?? []) as unknown as SiblingRow[]
  const candidates: SimilarCandidate[] = siblingRows2.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    spirit_base: r.spirit_base,
    // For mono-spirit workspaces we surface the product expression in the
    // subtitle instead of a redundant "Tequila · Martini" kicker.
    spirit_label: monoSpirit ? r.global_products?.expression ?? r.spirit_base : r.spirit_base,
    glass_type: r.glass_type,
    orb_from: r.orb_from,
    orb_to: r.orb_to,
    image_url: r.image_url,
    creator_name: r.creators?.name ?? null,
    ingredient_keys: r.cocktail_ingredients
      .map((i) => ingredientKey(i))
      .filter((k): k is string => k != null),
  }))
  const targetIngredientKeys = ingredients
    .map((i) =>
      ingredientKey({
        global_ingredient_id: i.global_ingredient_id,
        workspace_ingredient_id: i.workspace_ingredient_id,
        global_product_id: i.global_products?.id ?? null,
        custom_name: i.custom_name,
      }),
    )
    .filter((k): k is string => k != null)
  const similar = findSimilar(
    {
      id: cocktail.id,
      category: cocktail.category,
      spirit_base: cocktail.spirit_base,
      glass_type: cocktail.glass_type,
      ingredient_keys: targetIngredientKeys,
    },
    candidates,
    { limit: 5, minScore: 0.1 },
  )

  const orbFrom = cocktail.orb_from ?? '#f6efe2'
  const orbTo = cocktail.orb_to ?? '#c9b89a'
  // Gallery is the source of truth; fall back to the legacy single image_url
  // column so older rows that predate multi-upload still render.
  const gallery: string[] = (cocktail.images ?? []).length > 0
    ? (cocktail.images ?? [])
    : cocktail.image_url
      ? [cocktail.image_url]
      : []
  const flavor = cocktail.flavor_profile ?? []

  function ingredientLabel(i: IngredientJoin): string {
    return (
      i.global_ingredients?.name ??
      (i.global_products ? `${i.global_products.brand} · ${i.global_products.expression}` : null) ??
      i.workspace_ingredients?.name ??
      i.custom_name ??
      'Unknown'
    )
  }

  function ingredientAmount(i: IngredientJoin): string {
    if (i.amount_text) return i.amount_text
    if (i.amount != null) return `${i.amount}${i.unit ? ` ${i.unit}` : ''}`
    return ''
  }

  function ingredientHref(i: IngredientJoin): string | null {
    if (i.global_ingredient_id) return `/ingredients/${i.global_ingredient_id}`
    if (i.workspace_ingredient_id) return `/ingredients/${i.workspace_ingredient_id}`
    // Free-text custom ingredients: link via the normalized slug so the
    // aggregate detail page can find all cocktails using the same name.
    if (i.custom_name && i.custom_name.trim()) {
      const slug = slugifyIngredient(i.custom_name)
      if (slug) return `/ingredients/${slug}`
    }
    return null
  }

  // Build a clean plaintext recipe for the Copy button
  const recipeLines: string[] = []
  recipeLines.push(cocktail.name)
  const topLine = [cocktail.category, spiritLabel, cocktail.glass_type]
    .filter(Boolean)
    .join(' · ')
  if (topLine) recipeLines.push(topLine)
  if (cocktail.tasting_notes) recipeLines.push('', cocktail.tasting_notes)
  if (ingredients.length > 0) {
    recipeLines.push('', 'INGREDIENTS')
    for (const i of ingredients) {
      const amount = ingredientAmount(i)
      recipeLines.push(`• ${ingredientLabel(i)}${amount ? ` — ${amount}` : ''}${i.notes ? ` (${i.notes})` : ''}`)
    }
  }
  if (methodSteps.length > 0) {
    recipeLines.push('', 'METHOD')
    methodSteps.forEach((s, idx) => {
      recipeLines.push(`${s.step ?? idx + 1}. ${s.text ?? ''}`)
    })
  }
  if (cocktail.garnish) recipeLines.push('', `GARNISH: ${cocktail.garnish}`)
  if (cocktail.creators?.name) recipeLines.push('', `— ${cocktail.creators.name}${cocktail.creators.venue ? `, ${cocktail.creators.venue}` : ''}`)
  const recipeText = recipeLines.join('\n')

  return (
    <div className="page fade-up" style={{ maxWidth: 1180 }}>
      {/* Hero */}
      <div
        className="card"
        style={{
          overflow: 'hidden',
          marginBottom: 28,
          padding: 0,
        }}
      >
        <div className="cocktail-hero-grid">
          <div className="cocktail-hero-body">
            <div className="row gap-sm" style={{ marginBottom: 16 }}>
              <span
                className="pill"
                style={{
                  background: cocktail.status === 'published' ? '#e3f0e9' : 'var(--bg-sunken)',
                  color: cocktail.status === 'published' ? 'var(--ok)' : 'var(--ink-3)',
                  borderColor: 'transparent',
                }}
              >
                {cocktail.status === 'published'
                  ? 'Published'
                  : cocktail.status === 'draft'
                    ? 'Draft'
                    : cocktail.status}
              </span>
            </div>

            <h1
              className="cocktail-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 52,
                letterSpacing: '-0.02em',
                lineHeight: 1.02,
                margin: 0,
                textWrap: 'balance',
              }}
            >
              {cocktail.name}
            </h1>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 14,
                alignItems: 'center',
              }}
            >
              {cocktail.category && <span className="pill">{cocktail.category}</span>}
              {spiritLabel && (
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    color: 'var(--ink-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {spiritLabel}
                </span>
              )}
              {flavor.length > 0 &&
                flavor.map((f) => (
                  <span
                    key={f}
                    className="pill"
                    style={{
                      background: 'var(--accent-wash)',
                      color: 'var(--accent-ink)',
                      borderColor: 'transparent',
                    }}
                  >
                    {f}
                  </span>
                ))}
            </div>
            {cocktail.tasting_notes && (
              <p
                style={{
                  color: 'var(--ink-2)',
                  fontSize: 15.5,
                  lineHeight: 1.55,
                  marginTop: 18,
                  marginBottom: 0,
                  maxWidth: '52ch',
                }}
              >
                {cocktail.tasting_notes}
              </p>
            )}
          </div>

          <div
            className="cocktail-hero-image"
            style={{
              background:
                gallery.length > 0
                  ? undefined
                  : `radial-gradient(120% 100% at 30% 25%, ${orbFrom}, ${orbTo} 75%)`,
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
            }}
          >
            {gallery.length > 0 ? (
              <CocktailGallery images={gallery} alt={cocktail.name} fill borderRadius={0} />
            ) : (
              <DrinkOrb from={orbFrom} to={orbTo} size={200} ring />
            )}
          </div>
        </div>
      </div>

      {/* Specs strip */}
      <div
        className="card cocktail-specs"
        style={{
          padding: 0,
          marginBottom: 28,
        }}
      >
        <Spec label="Glass">
          {cocktail.glass_type ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GlassIcon glass={cocktail.glass_type} size={18} />
              <span style={{ fontSize: 13.5 }}>{cocktail.glass_type}</span>
            </div>
          ) : (
            <em style={{ color: 'var(--ink-4)' }}>—</em>
          )}
        </Spec>
        <Spec label="Garnish">
          {cocktail.garnish ?? <em style={{ color: 'var(--ink-4)' }}>—</em>}
        </Spec>
        <Spec label="Creator">
          {cocktail.creators ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={cocktail.creators.name} size={20} src={cocktail.creators.photo_url} />
              <span style={{ fontSize: 13.5 }}>{cocktail.creators.name}</span>
            </div>
          ) : (
            <em style={{ color: 'var(--ink-4)' }}>Unattributed</em>
          )}
        </Spec>
        <Spec label="Updated">
          <span className="mono" style={{ fontSize: 12 }}>
            {cocktail.updated_at ? new Date(cocktail.updated_at).toLocaleDateString() : '—'}
          </span>
        </Spec>
      </div>

      {/* Ingredients + Method */}
      <div
        className="cocktail-body"
        style={{
          marginBottom: 28,
        }}
      >
        <div className="card card-pad" style={{ padding: 28 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>
            Ingredients
          </div>
          {ingredients.length === 0 ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '24px 0' }}>
              No ingredients yet. Use Edit to add them.
            </div>
          ) : (
            <div className="col" style={{ gap: 0 }}>
              {ingredients.map((i) => (
                <div
                  key={i.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr auto',
                    gap: 12,
                    padding: '12px 0',
                    borderTop: i.position > 1 ? '1px solid var(--line-2)' : '0',
                    alignItems: 'baseline',
                  }}
                >
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                    {String(i.position).padStart(2, '0')}
                  </span>
                  <div className="col" style={{ gap: 2 }}>
                    {ingredientHref(i) ? (
                      <Link
                        href={ingredientHref(i) as string}
                        style={{ fontSize: 14, color: 'var(--ink-1)' }}
                        className="ingredient-link"
                      >
                        {ingredientLabel(i)}
                      </Link>
                    ) : (
                      <span style={{ fontSize: 14 }}>{ingredientLabel(i)}</span>
                    )}
                    {i.notes && <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{i.notes}</span>}
                  </div>
                  <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                    {ingredientAmount(i)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad" style={{ padding: 28 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>
            Method
          </div>
          {methodSteps.length === 0 ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '24px 0' }}>
              No steps yet.
            </div>
          ) : (
            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {methodSteps.map((s, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr',
                    gap: 12,
                    padding: '12px 0',
                    borderTop: idx > 0 ? '1px solid var(--line-2)' : '0',
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--accent-ink)', paddingTop: 2 }}
                  >
                    {String(s.step ?? idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.5 }}>{s.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Creator card */}
      {cocktail.creators && (
        <div
          className="card card-pad"
          style={{ padding: 22, display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28 }}
        >
          <Avatar name={cocktail.creators.name} size={44} src={cocktail.creators.photo_url} />
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <div className="panel-title">Creator</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 18,
                letterSpacing: '-0.01em',
              }}
            >
              {cocktail.creators.name}
            </div>
            {(cocktail.creators.venue || cocktail.creators.bio) && (
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                {cocktail.creators.venue}
                {cocktail.creators.venue && cocktail.creators.bio ? ' · ' : ''}
                {cocktail.creators.bio}
              </div>
            )}
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div
            className="row"
            style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}
          >
            <div className="col">
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-4)',
                }}
              >
                In the same vein
              </span>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 22,
                  letterSpacing: '-0.01em',
                }}
              >
                Similar cocktails.
              </h2>
            </div>
          </div>
          <div
            className="similar-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${similar.length}, 1fr)`,
              gap: 14,
            }}
          >
            {similar.map((c) => (
              <Link
                key={c.id}
                href={`/cocktails/${c.slug}`}
                className="card similar-card"
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
                    // eslint-disable-next-line @next/next/no-img-element
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
                      size={90}
                      ring
                    />
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: 16,
                      letterSpacing: '-0.01em',
                      color: 'var(--ink-1)',
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: 'var(--ink-4)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {[c.spirit_label, c.category].filter(Boolean).join(' · ') ||
                      c.creator_name ||
                      '—'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginTop: 32,
        }}
      >
        <Link href="/cocktails" className="btn-ghost">
          <Icon name="chevron-l" size={14} /> All cocktails
        </Link>
        <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
          <CopyRecipeButton text={recipeText} />
          <CollectionPicker
            cocktailId={cocktail.id}
            allCollections={allCollections}
            memberIds={memberIds}
          />
          <Link href={`/cocktails/${cocktail.slug}/edit`} className="btn-secondary">
            <Icon name="edit" size={13} />
            Edit
          </Link>
        </div>
      </div>
    </div>
  )
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '18px 22px',
        borderRight: '1px solid var(--line-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span
        className="mono"
        style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-4)' }}
      >
        {label}
      </span>
      <div>{children}</div>
    </div>
  )
}
