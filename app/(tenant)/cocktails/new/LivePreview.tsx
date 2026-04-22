'use client'

import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import { formatIngredientAmount } from '@/lib/cocktail/categories'
import type { Draft } from './types'

export function LivePreview({ draft }: { draft: Draft }) {
  const filled = draft.ingredients.filter((i) => i.name.trim().length > 0)

  return (
    <div
      className="card wizard-preview"
      style={{
        padding: 0,
        overflow: 'hidden',
        height: 'fit-content',
        position: 'sticky',
        top: 96,
      }}
    >
      <div
        style={{
          aspectRatio: '1 / 1',
          width: '100%',
          background: `radial-gradient(120% 100% at 30% 25%, ${draft.color1}, ${draft.color2} 75%)`,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {draft.photo_data_url ? (
          <img
            src={draft.photo_data_url}
            alt="Cocktail preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
          />
        ) : (
          <DrinkOrb from={draft.color1} to={draft.color2} size={180} ring />
        )}
      </div>
      <div style={{ padding: 22 }}>
        <div className="panel-title">Live preview</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginTop: 6 }}>
          {draft.name || 'Untitled cocktail'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>
          {[draft.spirit, draft.category, draft.glass].filter(Boolean).join(' · ') || '—'}
        </div>
        <div className="hr" />
        {filled.length > 0 ? (
          filled.map((ing, i) => (
            <div
              key={i}
              className="row"
              style={{ justifyContent: 'space-between', padding: '6px 0' }}
            >
              <span style={{ fontSize: 13 }}>{ing.name}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {formatIngredientAmount(ing.amount, ing.unit)}
              </span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
            Add ingredients to see them here.
          </div>
        )}
        {draft.flavor.length > 0 && (
          <>
            <div className="hr" />
            <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
              {draft.flavor.map((f) => (
                <span
                  key={f}
                  className="pill"
                  style={{
                    background: 'var(--accent-wash)',
                    color: 'var(--accent-ink)',
                    borderColor: 'transparent',
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
