import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { Icon } from '@/components/icons'
import { BasicsForm } from './BasicsForm'
import { MethodEditor } from './MethodEditor'
import { IngredientEditor, type IngredientRow } from './IngredientEditor'
import { CocktailImageUploader } from './CocktailImageUploader'
import { deleteCocktailAction } from './actions'

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
  method_steps: unknown
  featured: boolean
  pinned: boolean
  image_url: string | null
  images: string[] | null
}

type IngredientJoin = {
  id: string
  position: number
  amount: number | null
  unit: string | null
  notes: string | null
  custom_name: string | null
  global_ingredients: { name: string } | null
  global_products: { brand: string; expression: string } | null
  workspace_ingredients: { name: string } | null
}

export default async function EditCocktailPage({ params }: Props) {
  const { id } = await params
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const { data: cocktailData } = await supabase
    .from('cocktails')
    .select(
      'id, slug, name, status, category, spirit_base, glass_type, garnish, tasting_notes, method_steps, featured, pinned, image_url, images',
    )
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const cocktail = cocktailData as CocktailRow | null
  if (!cocktail) notFound()

  // Ingredients
  const { data: ingredientsData } = await supabase
    .from('cocktail_ingredients')
    .select(
      'id, position, amount, unit, notes, custom_name, global_ingredients(name), global_products(brand, expression), workspace_ingredients(name)',
    )
    .eq('cocktail_id', id)
    .order('position')
  const ingredientRows = ((ingredientsData ?? []) as unknown as IngredientJoin[]).map<IngredientRow>((r) => ({
    id: r.id,
    position: r.position,
    amount: r.amount,
    unit: r.unit,
    notes: r.notes,
    display:
      r.global_ingredients?.name ??
      (r.global_products ? `${r.global_products.brand} · ${r.global_products.expression}` : null) ??
      r.workspace_ingredients?.name ??
      r.custom_name ??
      'Unknown',
  }))

  const methodSteps = Array.isArray(cocktail.method_steps)
    ? (cocktail.method_steps as { step?: number; text?: string }[])
        .map((s, i) => ({ step: typeof s.step === 'number' ? s.step : i + 1, text: s.text ?? '' }))
    : []

  return (
    <div className="page fade-up" style={{ maxWidth: 960 }}>
      <div className="page-head">
        <Link
          href={`/cocktails/${cocktail.id}`}
          className="row gap-sm"
          style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}
        >
          <Icon name="chevron-l" size={13} />
          Back to detail
        </Link>
        <div className="page-kicker">Editing</div>
        <h1 className="page-title">{cocktail.name}</h1>
      </div>

      <div className="col" style={{ gap: 20 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 260px',
            gap: 20,
            alignItems: 'start',
          }}
          className="cocktail-edit-top"
        >
          <BasicsForm cocktail={cocktail} />
          <div
            className="card card-pad"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div className="panel-title">Hero image</div>
            <CocktailImageUploader
              cocktailId={cocktail.id}
              images={
                (cocktail.images?.length ?? 0) > 0
                  ? cocktail.images ?? []
                  : cocktail.image_url
                    ? [cocktail.image_url]
                    : []
              }
            />
            <p style={{ fontSize: 11, color: 'var(--ink-4)', margin: 0, lineHeight: 1.4 }}>
              Portrait 4:5 works best. If none is set, the cocktail&apos;s orb gradient is
              shown instead.
            </p>
          </div>
        </div>

        <IngredientEditor cocktailId={cocktail.id} rows={ingredientRows} />

        <MethodEditor id={cocktail.id} initial={methodSteps} />

        <form
          action={deleteCocktailAction}
          className="card card-pad"
          style={{
            padding: 22,
            border: '1px solid #f0cccc',
            background: '#fdf7f7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <input type="hidden" name="id" value={cocktail.id} />
          <div>
            <div className="panel-title" style={{ color: 'var(--crit)', marginBottom: 4 }}>
              Danger zone
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: 0 }}>
              Deletes the cocktail and all its ingredients. This can&apos;t be undone.
            </p>
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: '#fff',
              color: 'var(--crit)',
              border: '1px solid #e6b3b3',
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            Delete cocktail
          </button>
        </form>
      </div>
    </div>
  )
}
