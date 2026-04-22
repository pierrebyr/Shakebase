import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { ProductEditForm, type UsedInRef } from './ProductEditForm'
import './product-edit.css'

type Props = { params: Promise<{ id: string }> }

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

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const { data } = await supabase
    .from('workspace_products')
    .select(
      'id, stock, par, cost_cents, menu_price_cents, global_products(id, brand, expression, category, abv, origin, description, tagline, tasting_notes, volume_ml, color_hex, image_url, provenance)',
    )
    .eq('workspace_id', workspace.id)
    .eq('id', id)
    .maybeSingle()

  const row = data as WorkspaceRow | null
  if (!row || !row.global_products) notFound()
  const g = row.global_products

  // Cocktails that reference this product
  const { data: usedData } = await supabase
    .from('cocktails')
    .select('id, slug, name, category, orb_from, orb_to, image_url')
    .eq('workspace_id', workspace.id)
    .eq('base_product_id', g.id)
    .neq('status', 'archived')
    .order('name')
    .limit(12)

  const used: UsedInRef[] = ((usedData ?? []) as unknown as UsedInRef[]).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    category: c.category,
    orb_from: c.orb_from,
    orb_to: c.orb_to,
    image_url: c.image_url,
  }))

  return (
    <ProductEditForm
      workspaceProductId={row.id}
      globalProductId={g.id}
      initial={{
        brand: g.brand,
        expression: g.expression,
        category: g.category ?? '',
        abv: g.abv ?? null,
        origin: g.origin ?? '',
        tagline: g.tagline ?? '',
        tasting_notes: g.tasting_notes ?? g.description ?? '',
        volume_ml: g.volume_ml ?? 750,
        color_hex: g.color_hex ?? '#efe6c9',
        image_url: g.image_url ?? null,
        provenance: g.provenance ?? {},
        stock: row.stock ?? 0,
        par: row.par ?? 0,
        cost_cents: row.cost_cents ?? 0,
        menu_price_cents: row.menu_price_cents ?? 0,
      }}
      usedIn={used}
    />
  )
}
