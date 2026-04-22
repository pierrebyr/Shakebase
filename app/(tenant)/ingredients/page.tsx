import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { Icon } from '@/components/icons'
import { AddWorkspaceIngredientForm } from './AddForm'
import { SuggestIngredientModal } from '@/components/catalog/SuggestIngredientModal'
import { MySuggestions } from '@/components/catalog/MySuggestions'
import { slugifyIngredient, inferIngredientCategory } from '@/lib/ingredient-slug'
import { IngredientBrowser, type IngredientRow } from './IngredientBrowser'

type UsageViewRow = {
  global_ingredient_id: string | null
  workspace_ingredient_id: string | null
  name: string
  category: string | null
  usage_count: number
}

export default async function IngredientsPage() {
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  // Pre-aggregated view — one row per (workspace, ingredient) with count.
  // Much lighter than pulling every cocktail_ingredients row.
  const { data: usage } = await supabase
    .from('workspace_ingredient_usage')
    .select('global_ingredient_id, workspace_ingredient_id, name, category, usage_count')
    .eq('workspace_id', workspace.id)
    .order('usage_count', { ascending: false })

  const rows = (usage ?? []) as unknown as UsageViewRow[]

  // Dedupe by slug (handles edge cases where two different FKs share the
  // same display name — e.g. a global and a workspace row).
  const agg = new Map<string, { slug: string; displayName: string; count: number; category: string; linkedId: string | null }>()
  for (const r of rows) {
    if (!r.name || !r.name.trim()) continue
    const slug = slugifyIngredient(r.name)
    if (!slug) continue

    const linkedId = r.global_ingredient_id ?? r.workspace_ingredient_id ?? null
    // Always infer from the display name so categorization is consistent
    // regardless of whatever was stamped on the row in the DB.
    const category = inferIngredientCategory(r.name)

    const existing = agg.get(slug)
    if (existing) {
      existing.count += r.usage_count
      if (!existing.linkedId && linkedId) existing.linkedId = linkedId
    } else {
      agg.set(slug, {
        slug,
        displayName: r.name.trim(),
        count: r.usage_count,
        category,
        linkedId,
      })
    }
  }

  const ingredientsList: IngredientRow[] = [...agg.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.displayName.localeCompare(b.displayName)
  })

  // Workspace-scoped ingredients (the user's own pantry entries, visible
  // regardless of whether they're currently referenced by any cocktail)
  const { data: wsData } = await supabase
    .from('workspace_ingredients')
    .select('id, name, category')
    .eq('workspace_id', workspace.id)
    .order('name')
  const wsRows = (wsData ?? []) as {
    id: string
    name: string
    category: string | null
  }[]

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div className="page-kicker">
          Pantry · {ingredientsList.length} in rotation
        </div>
        <h1 className="page-title">Ingredients.</h1>
        <p className="page-sub">
          Every ingredient your cocktails call for — sorted by how often they&apos;re poured.
          Tap any pill to see the cocktails that use it.
        </p>
      </div>

      <div className="ingredients-layout">
        <div className="card card-pad ingredients-browser" style={{ padding: 28 }}>
          <IngredientBrowser ingredients={ingredientsList} />
        </div>

        <div className="col" style={{ gap: 20 }}>
          <div className="card card-pad" style={{ padding: 22 }}>
            <div className="panel-title" style={{ marginBottom: 10 }}>
              Workspace-only entries · {wsRows.length}
            </div>
            {wsRows.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>
                No workspace-specific ingredients yet. Add one below if you use an unusual syrup
                or infusion that isn&apos;t in the shared catalog.
              </p>
            ) : (
              <div
                style={{
                  border: '1px solid var(--line-2)',
                  borderRadius: 10,
                  maxHeight: 380,
                  overflowY: 'auto',
                  background: '#fff',
                }}
              >
                {wsRows.map((w, i) => (
                  <Link
                    key={w.id}
                    href={`/ingredients/${w.id}`}
                    className="ws-ing-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '9px 12px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--line-2)',
                      fontSize: 12.5,
                      color: 'var(--ink-1)',
                      textDecoration: 'none',
                      transition: 'background 120ms',
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {w.name}
                    </span>
                    <Icon
                      name="chevron-r"
                      size={11}
                      style={{ color: 'var(--ink-4)', flexShrink: 0 }}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <AddWorkspaceIngredientForm />

          <div
            className="card card-pad"
            style={{
              padding: 22,
              background: 'var(--bg-sunken)',
              border: '1px dashed var(--line-1)',
              boxShadow: 'none',
            }}
          >
            <div className="panel-title" style={{ marginBottom: 6 }}>
              Missing a classic?
            </div>
            <p
              style={{
                fontSize: 12.5,
                color: 'var(--ink-3)',
                margin: '0 0 12px',
                lineHeight: 1.55,
              }}
            >
              Suggest an ingredient every bar would want. Hyper-specific ones are better as
              workspace-only.
            </p>
            <SuggestIngredientModal />
          </div>

          <MySuggestions kind="ingredient" />
        </div>
      </div>
    </div>
  )
}
