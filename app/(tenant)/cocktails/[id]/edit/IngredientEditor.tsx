'use client'

import { removeIngredientAction } from './actions'
import { Icon } from '@/components/icons'
import { IngredientAutocomplete } from './IngredientAutocomplete'

export type IngredientRow = {
  id: string
  position: number
  display: string
  amount: number | null
  unit: string | null
  notes: string | null
}

type Props = {
  cocktailId: string
  rows: IngredientRow[]
}

export function IngredientEditor({ cocktailId, rows }: Props) {
  return (
    <div className="card card-pad" style={{ padding: 28 }}>
      <div className="panel-title" style={{ marginBottom: 18 }}>
        Ingredients
      </div>

      {rows.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--ink-4)', marginBottom: 16 }}>
          No ingredients yet. Add one below.
        </p>
      )}

      <div className="col" style={{ gap: 8, marginBottom: 20 }}>
        {rows.map((r) => (
          <div
            key={r.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr auto auto',
              gap: 10,
              padding: '10px 12px',
              border: '1px solid var(--line-2)',
              borderRadius: 12,
              background: '#fff',
              alignItems: 'center',
            }}
          >
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
              {String(r.position).padStart(2, '0')}
            </span>
            <div className="col" style={{ gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 13.5 }}>{r.display}</span>
              {r.notes && <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{r.notes}</span>}
            </div>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
              {r.amount != null ? `${r.amount}${r.unit ? ` ${r.unit}` : ''}` : ''}
            </span>
            <form action={removeIngredientAction}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="cocktail_id" value={cocktailId} />
              <button type="submit" className="icon-btn" style={{ color: 'var(--crit)' }} title="Remove">
                <Icon name="x" size={13} />
              </button>
            </form>
          </div>
        ))}
      </div>

      <IngredientAutocomplete cocktailId={cocktailId} />
    </div>
  )
}
