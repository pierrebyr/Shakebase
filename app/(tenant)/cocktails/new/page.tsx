import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { NewCocktailWizard } from './NewCocktailWizard'
import type { BaseProductOption, CreatorOption } from './types'

type WsProductRow = {
  global_products: {
    id: string
    brand: string
    expression: string
    category: string
    color_hex: string | null
  } | null
}

export default async function NewCocktailPage() {
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const [{ data: creatorRows }, { data: productRows }] = await Promise.all([
    supabase
      .from('creators')
      .select('id, name, bio, venue')
      .eq('workspace_id', workspace.id)
      .order('name'),
    supabase
      .from('workspace_products')
      .select('global_products(id, brand, expression, category, color_hex)')
      .eq('workspace_id', workspace.id),
  ])

  const creators = (
    (creatorRows ?? []) as unknown as { id: string; name: string; bio: string | null; venue: string | null }[]
  ).map<CreatorOption>((c) => ({
    id: c.id,
    name: c.name,
    role: c.bio,
    venue: c.venue,
  }))

  const baseProducts = ((productRows ?? []) as unknown as WsProductRow[])
    .map((r) => r.global_products)
    .filter((g): g is NonNullable<WsProductRow['global_products']> => g != null)
    .map<BaseProductOption>((g) => ({
      id: g.id,
      brand: g.brand,
      expression: g.expression,
      category: g.category,
      color_hex: g.color_hex ?? '#f4efe0',
    }))
    .sort((a, b) => `${a.brand} ${a.expression}`.localeCompare(`${b.brand} ${b.expression}`))

  return (
    <div className="page fade-up" style={{ maxWidth: 1080 }}>
      <div className="page-head">
        <div className="page-kicker">Submission · Draft</div>
        <h1 className="page-title">A new cocktail.</h1>
        <p className="page-sub">
          Identity, recipe, method, tasting, review — five moves to turn an idea into a repeatable drink.
        </p>
      </div>

      <NewCocktailWizard creators={creators} baseProducts={baseProducts} />
    </div>
  )
}
