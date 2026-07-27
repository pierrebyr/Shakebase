import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { rateLimit, rateLimitErrorMessage } from '@/lib/rate-limit'

// Full workspace snapshot as JSON. Requires active membership (any role).
// Large workspaces: we page every table in chunks of 1000 so we never
// pull more than that into memory in a single round-trip.
//
// The payload is denormalised on purpose: every cocktail carries its own
// ingredients (with resolved names, not just UUIDs), method steps, image
// URLs, creator and collections, so a single cocktail object reads standalone.
// Flat mirrors of every table follow for tooling that wants the relational shape.

type Paged = { from: number; to: number }
const PAGE = 1000
const FORMAT_VERSION = 2

// Supabase query builders are thenable — awaiting returns {data, error}.
// We accept any callback shape and trust the runtime contract.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll<T>(label: string, query: (p: Paged) => any): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = (await query({ from, to: from + PAGE - 1 })) as {
      data: T[] | null
      error: { message: string } | null
    }
    // A malformed select used to fall through as an empty array and a 200 OK —
    // an export that silently dropped a whole table. Fail loudly instead.
    if (error) throw new Error(`${label}: ${error.message}`)
    if (!data || data.length === 0) break
    out.push(...data)
    if (data.length < PAGE) break
  }
  return out
}

type NamedRef = { id: string; name: string }
type ProductRef = { id: string; brand: string; expression: string }

type IngredientRow = {
  id: string
  cocktail_id: string
  position: number | null
  amount: number | null
  unit: string | null
  amount_text: string | null
  notes: string | null
  custom_name: string | null
  global_ingredient_id: string | null
  workspace_ingredient_id: string | null
  global_product_id: string | null
  global_ingredients: (NamedRef & { category: string | null; allergens: string[] | null }) | null
  workspace_ingredients: (NamedRef & { category: string | null }) | null
  global_products: (ProductRef & { category: string | null; abv: number | null }) | null
}

// Same precedence the cocktail detail page uses to label a line.
function ingredientName(i: IngredientRow): string {
  if (i.custom_name) return i.custom_name
  if (i.workspace_ingredients?.name) return i.workspace_ingredients.name
  if (i.global_ingredients?.name) return i.global_ingredients.name
  if (i.global_products) return `${i.global_products.brand} ${i.global_products.expression}`.trim()
  return ''
}

function ingredientSource(i: IngredientRow): string {
  if (i.workspace_ingredient_id) return 'workspace_ingredient'
  if (i.global_ingredient_id) return 'global_ingredient'
  if (i.global_product_id) return 'product'
  return 'custom'
}

// "50 ml" / "3 dashes" / "Top up" — amount_text wins when the author typed one.
function quantityText(i: IngredientRow): string {
  if (i.amount_text) return i.amount_text
  const amount = i.amount == null ? '' : String(i.amount)
  return [amount, i.unit ?? ''].filter(Boolean).join(' ').trim()
}

function normalizeSteps(raw: unknown): { step: number; text: string }[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((s, idx) => {
      if (typeof s === 'string') return { step: idx + 1, text: s }
      const o = (s ?? {}) as { step?: number; text?: string }
      return { step: typeof o.step === 'number' ? o.step : idx + 1, text: o.text ?? '' }
    })
    .filter((s) => s.text.trim().length > 0)
}

// Storage URLs are already absolute; older/seeded rows may hold a site-relative
// path. Make everything absolute so the export is usable off-site.
function absolutize(url: string | null | undefined, origin: string): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  return origin ? `${origin}${url.startsWith('/') ? '' : '/'}${url}` : url
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  // Full workspace snapshot is the heaviest export — cap tighter.
  const rl = await rateLimit({
    key: `export-workspace:${user.id}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok) {
    return NextResponse.json(
      { error: rateLimitErrorMessage(rl.retryAfter) },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const h = await headers()
  const slug = h.get('x-workspace-slug')
  if (!slug) return NextResponse.json({ error: 'No workspace' }, { status: 400 })
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const origin = host ? `${proto}://${host}` : ''

  const admin = createAdminClient()
  const { data: ws } = await admin
    .from('workspaces')
    .select('id, slug, name, created_at')
    .eq('slug', slug)
    .maybeSingle()
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { data: mem } = await admin
    .from('memberships')
    .select('role')
    .eq('workspace_id', ws.id)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)
    .maybeSingle()
  if (!mem) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Explicit column lists — avoid `*` so we never leak internal state
  // (deleted_at, audit fields) and keep payloads tight.
  const COCKTAIL_COLS =
    'id, slug, name, status, category, spirit_base, base_product_id, glass_type, garnish, tasting_notes, flavor_profile, occasions, season, orb_from, orb_to, image_url, images, currency, menu_price_cents, cost_cents, method_steps, featured, pinned, venue, event_origin, creator_id, created_at, updated_at'
  // Embedded lookups resolve the FK columns to real names — a bare
  // global_ingredient_id is useless to anyone reading the file.
  const INGREDIENT_COLS =
    'id, cocktail_id, position, amount, unit, amount_text, notes, custom_name, global_ingredient_id, workspace_ingredient_id, global_product_id, global_ingredients(id, name, category, allergens), workspace_ingredients(id, name, category), global_products(id, brand, expression, category, abv)'
  const CREATOR_COLS =
    'id, name, bio, role, city, country, venue, photo_url, pronouns, signature, philosophy, specialties, languages, mentors, awards, competitions, certifications, career, press, book, socials, joined_year, created_at'
  const PRODUCT_COLS =
    'id, workspace_id, global_product_id, stock, par, cost_cents, menu_price_cents, notes, global_products(id, brand, expression, category, abv, origin, description, tagline, tasting_notes, volume_ml, color_hex, image_url, provenance)'
  const COLLECTION_COLS =
    'id, name, description, cover_from, cover_to, pinned, created_at, updated_at, collection_cocktails(cocktail_id, position, added_at)'

  let cocktails: Record<string, unknown>[]
  let ingredients: IngredientRow[]
  let creators: Record<string, unknown>[]
  let products: Record<string, unknown>[]
  let collections: Record<string, unknown>[]
  let customIngredients: Record<string, unknown>[]

  try {
    ;[cocktails, ingredients, creators, products, collections, customIngredients] =
      await Promise.all([
        fetchAll<Record<string, unknown>>('cocktails', ({ from, to }) =>
          admin
            .from('cocktails')
            .select(COCKTAIL_COLS)
            .eq('workspace_id', ws.id)
            .neq('status', 'archived')
            .order('created_at')
            .range(from, to),
        ),
        fetchAll<IngredientRow>('cocktail_ingredients', ({ from, to }) =>
          admin
            .from('cocktail_ingredients')
            .select(`${INGREDIENT_COLS}, cocktails!inner(workspace_id)`)
            .eq('cocktails.workspace_id', ws.id)
            .order('cocktail_id')
            .order('position')
            .range(from, to),
        ),
        fetchAll<Record<string, unknown>>('creators', ({ from, to }) =>
          admin
            .from('creators')
            .select(CREATOR_COLS)
            .eq('workspace_id', ws.id)
            .order('name')
            .range(from, to),
        ),
        fetchAll<Record<string, unknown>>('workspace_products', ({ from, to }) =>
          admin
            .from('workspace_products')
            .select(PRODUCT_COLS)
            .eq('workspace_id', ws.id)
            .range(from, to),
        ),
        fetchAll<Record<string, unknown>>('collections', ({ from, to }) =>
          admin
            .from('collections')
            .select(COLLECTION_COLS)
            .eq('workspace_id', ws.id)
            .range(from, to),
        ),
        fetchAll<Record<string, unknown>>('workspace_ingredients', ({ from, to }) =>
          admin
            .from('workspace_ingredients')
            .select('id, name, category, default_unit')
            .eq('workspace_id', ws.id)
            .order('name')
            .range(from, to),
        ),
      ])
  } catch (e) {
    return NextResponse.json(
      { error: `Export failed: ${e instanceof Error ? e.message : 'unknown error'}` },
      { status: 500 },
    )
  }

  // ── Index everything we nest under each cocktail
  const ingredientsByCocktail = new Map<string, IngredientRow[]>()
  for (const row of ingredients) {
    const list = ingredientsByCocktail.get(row.cocktail_id)
    if (list) list.push(row)
    else ingredientsByCocktail.set(row.cocktail_id, [row])
  }
  for (const list of ingredientsByCocktail.values()) {
    list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  const creatorById = new Map(creators.map((c) => [c.id as string, c]))
  const productByGlobalId = new Map<string, Record<string, unknown>>()
  for (const p of products) {
    const gp = p.global_products as Record<string, unknown> | null
    if (gp?.id) productByGlobalId.set(gp.id as string, gp)
  }

  const collectionsByCocktail = new Map<string, { id: string; name: string }[]>()
  for (const col of collections) {
    const links = (col.collection_cocktails ?? []) as { cocktail_id: string }[]
    for (const link of links) {
      const entry = { id: col.id as string, name: col.name as string }
      const list = collectionsByCocktail.get(link.cocktail_id)
      if (list) list.push(entry)
      else collectionsByCocktail.set(link.cocktail_id, [entry])
    }
  }

  const fullCocktails = cocktails.map((c) => {
    const id = c.id as string
    const primary = absolutize(c.image_url as string | null, origin)
    const gallery = ((c.images as string[] | null) ?? [])
      .map((u) => absolutize(u, origin))
      .filter((u): u is string => Boolean(u))
    const rows = ingredientsByCocktail.get(id) ?? []

    return {
      ...c,
      image_url: primary,
      images: gallery,
      // Every image for this cocktail, primary first, de-duplicated.
      all_image_urls: Array.from(new Set([primary, ...gallery].filter(Boolean) as string[])),
      method_steps: normalizeSteps(c.method_steps),
      creator: c.creator_id ? creatorById.get(c.creator_id as string) ?? null : null,
      base_product: c.base_product_id
        ? productByGlobalId.get(c.base_product_id as string) ?? null
        : null,
      collections: collectionsByCocktail.get(id) ?? [],
      ingredients: rows.map((i) => ({
        id: i.id,
        position: i.position,
        name: ingredientName(i),
        quantity: quantityText(i),
        amount: i.amount,
        unit: i.unit,
        amount_text: i.amount_text,
        notes: i.notes,
        source: ingredientSource(i),
        category: i.workspace_ingredients?.category ?? i.global_ingredients?.category ?? null,
        allergens: i.global_ingredients?.allergens ?? [],
        product: i.global_products
          ? {
              id: i.global_products.id,
              brand: i.global_products.brand,
              expression: i.global_products.expression,
              category: i.global_products.category,
              abv: i.global_products.abv,
            }
          : null,
        global_ingredient_id: i.global_ingredient_id,
        workspace_ingredient_id: i.workspace_ingredient_id,
        global_product_id: i.global_product_id,
      })),
    }
  })

  const payload = {
    exported_at: new Date().toISOString(),
    format_version: FORMAT_VERSION,
    workspace: ws,
    counts: {
      cocktails: fullCocktails.length,
      creators: creators.length,
      products: products.length,
      collections: collections.length,
      custom_ingredients: customIngredients.length,
      cocktail_ingredients: ingredients.length,
    },
    // Self-contained: each entry carries its ingredients, steps, images,
    // creator, base product and collections.
    cocktails: fullCocktails,
    creators,
    products,
    collections,
    custom_ingredients: customIngredients,
    // Flat relational mirror of the join table, for tooling that prefers it.
    cocktail_ingredients: ingredients.map((i) => ({
      id: i.id,
      cocktail_id: i.cocktail_id,
      position: i.position,
      name: ingredientName(i),
      quantity: quantityText(i),
      amount: i.amount,
      unit: i.unit,
      amount_text: i.amount_text,
      notes: i.notes,
      custom_name: i.custom_name,
      global_ingredient_id: i.global_ingredient_id,
      workspace_ingredient_id: i.workspace_ingredient_id,
      global_product_id: i.global_product_id,
    })),
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="${ws.slug}-export.json"`,
    },
  })
}
