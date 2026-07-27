import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { toCsv } from '@/lib/csv'
import { rateLimit, rateLimitErrorMessage } from '@/lib/rate-limit'

// Long-format recipe book: one row per ingredient line, repeating the cocktail
// name/slug on each row. This is the shape spreadsheets and BI tools want —
// cocktails.csv is the one-row-per-cocktail summary.

type CocktailRow = {
  id: string
  slug: string
  name: string
  status: string
  category: string | null
  spirit_base: string | null
  glass_type: string | null
  garnish: string | null
  image_url: string | null
  method_steps: unknown
  creators: { name: string } | null
}

type IngredientRow = {
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
  global_ingredients: { name: string; category: string | null } | null
  workspace_ingredients: { name: string; category: string | null } | null
  global_products: { brand: string; expression: string } | null
}

function nameOf(i: IngredientRow): string {
  if (i.custom_name) return i.custom_name
  if (i.workspace_ingredients?.name) return i.workspace_ingredients.name
  if (i.global_ingredients?.name) return i.global_ingredients.name
  if (i.global_products) return `${i.global_products.brand} ${i.global_products.expression}`.trim()
  return ''
}

function sourceOf(i: IngredientRow): string {
  if (i.workspace_ingredient_id) return 'workspace_ingredient'
  if (i.global_ingredient_id) return 'global_ingredient'
  if (i.global_product_id) return 'product'
  return 'custom'
}

function methodText(raw: unknown): string {
  if (!Array.isArray(raw)) return ''
  return raw
    .map((s, idx) => {
      const text = typeof s === 'string' ? s : ((s ?? {}) as { text?: string }).text ?? ''
      const step = typeof s === 'object' && s ? (s as { step?: number }).step ?? idx + 1 : idx + 1
      return text.trim() ? `${step}. ${text.trim()}` : ''
    })
    .filter(Boolean)
    .join(' | ')
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const rl = await rateLimit({
    key: `export-recipes:${user.id}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok) {
    return NextResponse.json(
      { error: rateLimitErrorMessage(rl.retryAfter) },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const slug = (await headers()).get('x-workspace-slug')
  if (!slug) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const admin = createAdminClient()
  const { data: ws } = await admin
    .from('workspaces')
    .select('id, slug')
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

  const [{ data: cocktailData, error: cocktailError }, { data: ingredientData }] =
    await Promise.all([
      admin
        .from('cocktails')
        .select(
          'id, slug, name, status, category, spirit_base, glass_type, garnish, image_url, method_steps, creators(name)',
        )
        .eq('workspace_id', ws.id)
        .neq('status', 'archived')
        .order('name'),
      admin
        .from('cocktail_ingredients')
        .select(
          'cocktail_id, position, amount, unit, amount_text, notes, custom_name, global_ingredient_id, workspace_ingredient_id, global_product_id, global_ingredients(name, category), workspace_ingredients(name, category), global_products(brand, expression), cocktails!inner(workspace_id)',
        )
        .eq('cocktails.workspace_id', ws.id),
    ])

  if (cocktailError) {
    return NextResponse.json({ error: `Export failed: ${cocktailError.message}` }, { status: 500 })
  }

  const cocktails = (cocktailData ?? []) as unknown as CocktailRow[]
  const ingredients = (ingredientData ?? []) as unknown as IngredientRow[]

  const byCocktail = new Map<string, IngredientRow[]>()
  for (const i of ingredients) {
    const list = byCocktail.get(i.cocktail_id)
    if (list) list.push(i)
    else byCocktail.set(i.cocktail_id, [i])
  }
  for (const list of byCocktail.values()) {
    list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  const rows: Record<string, unknown>[] = []
  for (const c of cocktails) {
    const lines = byCocktail.get(c.id) ?? []
    const base = {
      cocktail_slug: c.slug,
      cocktail_name: c.name,
      status: c.status,
      category: c.category ?? '',
      spirit: c.spirit_base ?? '',
      glass: c.glass_type ?? '',
      garnish: c.garnish ?? '',
      creator: c.creators?.name ?? '',
      method: methodText(c.method_steps),
      image_url: c.image_url ?? '',
    }
    // A cocktail with no ingredients still gets a row — otherwise it would
    // vanish from the export entirely.
    if (lines.length === 0) {
      rows.push({
        ...base,
        ingredient_position: '',
        ingredient: '',
        amount: '',
        unit: '',
        quantity: '',
        ingredient_category: '',
        ingredient_source: '',
        ingredient_notes: '',
      })
      continue
    }
    for (const i of lines) {
      rows.push({
        ...base,
        ingredient_position: i.position ?? '',
        ingredient: nameOf(i),
        amount: i.amount ?? '',
        unit: i.unit ?? '',
        quantity:
          i.amount_text ?? [i.amount ?? '', i.unit ?? ''].filter(String).join(' ').trim(),
        ingredient_category:
          i.workspace_ingredients?.category ?? i.global_ingredients?.category ?? '',
        ingredient_source: sourceOf(i),
        ingredient_notes: i.notes ?? '',
      })
    }
  }

  const csv = toCsv(rows, [
    'cocktail_slug',
    'cocktail_name',
    'status',
    'category',
    'spirit',
    'glass',
    'garnish',
    'creator',
    'ingredient_position',
    'ingredient',
    'quantity',
    'amount',
    'unit',
    'ingredient_category',
    'ingredient_source',
    'ingredient_notes',
    'method',
    'image_url',
  ])
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${ws.slug}-recipes.csv"`,
    },
  })
}
