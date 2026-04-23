import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import { updateIngredientAction, deleteIngredientAction } from './actions'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}

type Ingredient = {
  id: string
  name: string
  category: string | null
  default_unit: string | null
  allergens: string[] | null
  created_at: string | null
}

type CocktailRef = {
  id: string
  name: string
  slug: string
  workspace_id: string
  workspaces: { id: string; name: string; slug: string } | null
}

export default async function AdminIngredientEditPage({ params, searchParams }: Props) {
  const { id } = await params
  const { saved } = await searchParams

  const admin = createAdminClient()

  const [{ data: ingRow }, { data: refRows }] = await Promise.all([
    admin
      .from('global_ingredients')
      .select('id, name, category, default_unit, allergens, created_at')
      .eq('id', id)
      .maybeSingle(),
    admin
      .from('cocktail_ingredients')
      .select('cocktail_id, cocktails(id, name, slug, workspace_id, workspaces(id, name, slug))')
      .eq('global_ingredient_id', id)
      .limit(200),
  ])

  const ingredient = ingRow as Ingredient | null
  if (!ingredient) notFound()

  // Dedupe cocktails — same cocktail can reference the ingredient multiple times.
  const seen = new Set<string>()
  const cocktails: CocktailRef[] = []
  for (const row of (refRows ?? []) as unknown as {
    cocktail_id: string
    cocktails: CocktailRef | null
  }[]) {
    if (!row.cocktails) continue
    if (seen.has(row.cocktails.id)) continue
    seen.add(row.cocktails.id)
    cocktails.push(row.cocktails)
  }

  const canDelete = cocktails.length === 0
  const allergensStr = (ingredient.allergens ?? []).join(', ')

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            <Link href="/admin/catalog?tab=ingredients" style={{ color: 'var(--op-ink-3)' }}>
              ← Catalog · Ingredients
            </Link>
          </div>
          <h1 className="op-title">{ingredient.name}</h1>
          <p className="op-sub">
            Canonical ingredient · referenced by {cocktails.length} cocktail
            {cocktails.length === 1 ? '' : 's'}.
          </p>
        </div>
      </div>

      {saved === '1' && (
        <div
          className="op-card"
          style={{
            padding: 12,
            marginBottom: 14,
            background: 'rgba(95,181,138,0.08)',
            border: '1px solid rgba(95,181,138,0.25)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <OpIcon name="check" size={14} style={{ color: 'var(--op-ok)' }} />
          <span style={{ fontSize: 13 }}>Saved.</span>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <form action={updateIngredientAction} className="op-card" style={{ padding: 22 }}>
          <input type="hidden" name="id" value={ingredient.id} />

          <Field label="Name" required>
            <input
              name="name"
              defaultValue={ingredient.name}
              required
              minLength={1}
              className="op-input"
            />
          </Field>
          <div style={{ height: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Category">
              <input
                name="category"
                defaultValue={ingredient.category ?? ''}
                placeholder="citrus, syrup, bitters…"
                className="op-input"
              />
            </Field>
            <Field label="Default unit">
              <input
                name="default_unit"
                defaultValue={ingredient.default_unit ?? ''}
                placeholder="oz, ml, dash…"
                maxLength={16}
                className="op-input"
              />
            </Field>
          </div>
          <div style={{ height: 12 }} />
          <Field label="Allergens (comma-separated)">
            <input
              name="allergens"
              defaultValue={allergensStr}
              placeholder="dairy, nuts, gluten…"
              className="op-input"
            />
          </Field>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              borderTop: '1px solid var(--op-line)',
              paddingTop: 18,
              marginTop: 22,
            }}
          >
            <Link href="/admin/catalog?tab=ingredients" className="op-btn ghost">
              Cancel
            </Link>
            <button type="submit" className="op-btn primary">
              Save changes
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="op-card" style={{ padding: 0 }}>
            <div className="op-card-head">
              <h3>Used in</h3>
              <span className="eyebrow" style={{ fontSize: 9.5 }}>
                {cocktails.length} cocktail{cocktails.length === 1 ? '' : 's'}
              </span>
            </div>
            <div>
              {cocktails.length === 0 ? (
                <div
                  className="op-empty"
                  style={{ padding: '24px 18px', textAlign: 'center' }}
                >
                  Not referenced yet.
                </div>
              ) : (
                cocktails.slice(0, 15).map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/activity/${c.workspace_id}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 18px',
                      borderTop: '1px solid var(--op-line)',
                      fontSize: 12.5,
                      color: 'var(--op-ink-1)',
                    }}
                  >
                    <span>{c.name}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--op-ink-4)',
                      }}
                    >
                      {c.workspaces?.slug ?? '—'}
                    </span>
                  </Link>
                ))
              )}
              {cocktails.length > 15 && (
                <div
                  style={{
                    padding: '8px 18px',
                    fontSize: 11,
                    color: 'var(--op-ink-4)',
                    borderTop: '1px solid var(--op-line)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  +{cocktails.length - 15} more
                </div>
              )}
            </div>
          </div>

          <form action={deleteIngredientAction} className="op-card" style={{ padding: 16 }}>
            <input type="hidden" name="id" value={ingredient.id} />
            <div className="eyebrow" style={{ color: 'var(--op-crit)', marginBottom: 6 }}>
              Danger zone
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--op-ink-2)', marginBottom: 12 }}>
              Permanently remove this ingredient. Blocked if any cocktail still references it.
            </div>
            <button
              type="submit"
              className="op-btn danger"
              disabled={!canDelete}
              style={{
                width: '100%',
                opacity: canDelete ? 1 : 0.5,
                cursor: canDelete ? 'pointer' : 'not-allowed',
              }}
              formNoValidate
            >
              {canDelete
                ? 'Delete ingredient'
                : `Delete blocked — ${cocktails.length} reference(s)`}
            </button>
          </form>
        </div>
      </div>

      <style>
        {`
          .op-input {
            width: 100%;
            padding: 9px 12px;
            background: var(--op-surface);
            border: 1px solid var(--op-line);
            border-radius: 8px;
            color: var(--op-ink-1);
            font-size: 13px;
            font-family: inherit;
            outline: none;
          }
          .op-input:focus { border-color: var(--op-accent); }
        `}
      </style>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span
        className="eyebrow"
        style={{ fontSize: 9.5, color: 'var(--op-ink-4)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--op-crit)', marginLeft: 4 }}>*</span>}
      </span>
      {children}
    </label>
  )
}
