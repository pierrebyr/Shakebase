import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'

// Full workspace snapshot as JSON. Requires active membership (any role).
// Large workspaces: we page every table in chunks of 1000 so we never
// pull more than that into memory in a single round-trip.

type Paged = { from: number; to: number }
const PAGE = 1000

// Supabase query builders are thenable — awaiting returns {data, error}.
// We accept any callback shape and trust the runtime contract.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll<T>(query: (p: Paged) => any): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data } = (await query({ from, to: from + PAGE - 1 })) as {
      data: T[] | null
    }
    if (!data || data.length === 0) break
    out.push(...data)
    if (data.length < PAGE) break
  }
  return out
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const slug = (await headers()).get('x-workspace-slug')
  if (!slug) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

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
    'id, slug, name, status, category, spirit_base, base_product_id, glass_type, garnish, tasting_notes, flavor_profile, occasions, season, orb_from, orb_to, image_url, images, menu_price_cents, cost_cents, method_steps, featured, venue, event_origin, creator_id, created_at, updated_at'
  const INGREDIENT_COLS =
    'id, cocktail_id, position, amount, unit, amount_text, notes, custom_name, global_ingredient_id, workspace_ingredient_id, global_product_id'
  const CREATOR_COLS =
    'id, name, bio, role, city, country, venue, photo_url, pronouns, signature, philosophy, specialties, languages, mentors, awards, competitions, certifications, career, press, book, socials, joined_year, created_at'
  const PRODUCT_COLS =
    'id, workspace_id, global_product_id, stock, par, cost_cents, menu_price_cents, global_products(id, brand, expression, category, abv, origin, description, tagline, tasting_notes, volume_ml, color_hex, image_url, provenance)'
  const COLLECTION_COLS =
    'id, name, description, cover_from, cover_to, pinned, created_at, updated_at, collection_cocktails(cocktail_id)'

  const [cocktails, ingredients, creators, products, collections] = await Promise.all([
    fetchAll(({ from, to }) =>
      admin
        .from('cocktails')
        .select(COCKTAIL_COLS)
        .eq('workspace_id', ws.id)
        .neq('status', 'archived')
        .order('created_at')
        .range(from, to),
    ),
    fetchAll(({ from, to }) =>
      admin
        .from('cocktail_ingredients')
        .select(`${INGREDIENT_COLS}, cocktails!inner(workspace_id)`)
        .eq('cocktails.workspace_id', ws.id)
        .order('cocktail_id')
        .range(from, to),
    ),
    fetchAll(({ from, to }) =>
      admin
        .from('creators')
        .select(CREATOR_COLS)
        .eq('workspace_id', ws.id)
        .order('name')
        .range(from, to),
    ),
    fetchAll(({ from, to }) =>
      admin
        .from('workspace_products')
        .select(PRODUCT_COLS)
        .eq('workspace_id', ws.id)
        .range(from, to),
    ),
    fetchAll(({ from, to }) =>
      admin
        .from('collections')
        .select(COLLECTION_COLS)
        .eq('workspace_id', ws.id)
        .range(from, to),
    ),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    workspace: ws,
    counts: {
      cocktails: cocktails.length,
      creators: creators.length,
      products: products.length,
      collections: collections.length,
      cocktail_ingredients: ingredients.length,
    },
    cocktails,
    cocktail_ingredients: ingredients,
    creators,
    products,
    collections,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="${ws.slug}-export.json"`,
    },
  })
}
