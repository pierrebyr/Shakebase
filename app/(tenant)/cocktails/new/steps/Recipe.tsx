'use client'

import { Icon } from '@/components/icons'
import { INGREDIENT_UNITS, QUALITATIVE_UNITS } from '@/lib/cocktail/categories'
import type { Draft } from '../types'
import { inputStyle } from './Identity'
import { IngredientNameInput } from '@/components/cocktail/IngredientNameInput'

export function StepRecipe({
  draft,
  update,
}: {
  draft: Draft
  update: (patch: Partial<Draft>) => void
}) {
  function updateIng(i: number, patch: Partial<Draft['ingredients'][number]>) {
    const next = [...draft.ingredients]
    next[i] = { ...next[i]!, ...patch }
    update({ ingredients: next })
  }
  function removeIng(i: number) {
    update({ ingredients: draft.ingredients.filter((_, idx) => idx !== i) })
  }
  function addIng() {
    update({ ingredients: [...draft.ingredients, { name: '', amount: '', unit: 'ml' }] })
  }

  return (
    <>
      <div className="panel-title" style={{ marginBottom: 16 }}>
        Build sheet · serves 1
      </div>

      {draft.ingredients.map((ing, i) => {
        const qualitative = QUALITATIVE_UNITS.includes(ing.unit)
        return (
          <div
            key={i}
            className="wizard-ing-row"
            style={{ marginBottom: 10 }}
          >
            <IngredientNameInput
              value={ing.name}
              onChange={(name) =>
                updateIng(i, { name, ingredient_id: null, ingredient_kind: null })
              }
              onSelect={(sel) =>
                updateIng(i, {
                  name: sel?.name ?? ing.name,
                  ingredient_id: sel?.id ?? null,
                  ingredient_kind: sel?.kind ?? null,
                })
              }
              placeholder="Ingredient"
              style={inputStyle}
            />
            <input
              value={qualitative ? '' : ing.amount}
              onChange={(e) => updateIng(i, { amount: e.target.value })}
              placeholder="50"
              inputMode="decimal"
              disabled={qualitative}
              style={{
                ...inputStyle,
                fontFamily: 'var(--font-mono)',
                textAlign: 'right',
                opacity: qualitative ? 0.45 : 1,
                cursor: qualitative ? 'not-allowed' : 'text',
              }}
            />
            <select
              value={ing.unit}
              onChange={(e) => updateIng(i, { unit: e.target.value })}
              style={inputStyle}
            >
              {INGREDIENT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="icon-btn"
              onClick={() => removeIng(i)}
              title="Remove"
            >
              <Icon name="x" size={13} />
            </button>
          </div>
        )
      })}

      <button type="button" className="btn-secondary" onClick={addIng} style={{ marginTop: 4 }}>
        <Icon name="plus" size={13} />
        Add ingredient
      </button>
    </>
  )
}
