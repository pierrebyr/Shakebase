'use client'

import { useRef } from 'react'
import { Icon } from '@/components/icons'
import { CATEGORIES, GLASS_TYPES, SPIRIT_BASES } from '@/lib/cocktail/categories'
import { compressImageFile } from '@/lib/image/compress'
import type { BaseProductOption, CreatorOption, Draft } from '../types'

// Darken a hex colour by mixing with #000 at the given ratio (0..1).
function darken(hex: string, ratio = 0.28): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const mix = (c: number) => Math.max(0, Math.floor(c * (1 - ratio)))
  return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`
}

// Map a product's global category (lowercase) → the capitalised spirit family we display.
function familyFromCategory(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes('tequila')) return 'Tequila'
  if (lower.includes('mezcal')) return 'Mezcal'
  if (lower.includes('gin')) return 'Gin'
  if (lower.includes('vodka')) return 'Vodka'
  if (lower.includes('rum')) return 'Rum'
  if (lower.includes('whisky') || lower.includes('whiskey')) return 'Whisky'
  if (lower.includes('rye')) return 'Rye'
  if (lower.includes('brandy') || lower.includes('cognac')) return 'Brandy'
  if (lower.includes('shochu')) return 'Shochu'
  if (lower.includes('amaro') || lower.includes('liqueur')) return 'Amaro'
  return 'Blend'
}

export function StepIdentity({
  draft,
  update,
  creators,
  baseProducts,
}: {
  draft: Draft
  update: (patch: Partial<Draft>) => void
  creators: CreatorOption[]
  baseProducts: BaseProductOption[]
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      alert('Image must be under 15 MB.')
      return
    }
    try {
      const { dataUrl } = await compressImageFile(file, { maxEdge: 1600, quality: 0.82 })
      update({
        photo_data_url: dataUrl,
        photo_filename: file.name,
      })
    } catch {
      alert('Could not read that image.')
    }
  }

  function onBaseChange(value: string) {
    if (value.startsWith('product:')) {
      const id = value.slice('product:'.length)
      const product = baseProducts.find((p) => p.id === id)
      if (!product) return
      const family = familyFromCategory(product.category)
      // Auto-tint the orb from the bottle's colour unless the user has
      // already moved the pickers. We only overwrite if they're still at
      // the defaults (no product previously selected, or matches last one).
      update({
        base_product_id: product.id,
        spirit: family,
        color1: product.color_hex,
        color2: darken(product.color_hex, 0.32),
      })
    } else {
      update({
        base_product_id: '',
        spirit: value.slice('family:'.length),
      })
    }
  }

  const currentValue = draft.base_product_id
    ? `product:${draft.base_product_id}`
    : draft.spirit
      ? `family:${draft.spirit}`
      : ''

  const brandsInPortfolio = new Set(baseProducts.map((p) => p.brand))
  const optgroupLabel =
    brandsInPortfolio.size === 1
      ? `${[...brandsInPortfolio][0]} portfolio`
      : 'Your bottles'

  return (
    <>
      <Field label="Cocktail name">
        <input
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Verbena Sour"
          style={{
            ...inputStyle,
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 400,
            fontStyle: 'italic',
          }}
        />
      </Field>

      <div className="wizard-trio" style={{ marginTop: 18 }}>
        <Field label="Base spirit">
          <select value={currentValue} onChange={(e) => onBaseChange(e.target.value)} style={inputStyle}>
            {baseProducts.length > 0 && (
              <optgroup label={optgroupLabel}>
                {baseProducts.map((p) => (
                  <option key={p.id} value={`product:${p.id}`}>
                    {p.brand} · {p.expression}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Or by family">
              {SPIRIT_BASES.map((s) => (
                <option key={s} value={`family:${s}`}>
                  {s}
                </option>
              ))}
            </optgroup>
          </select>
        </Field>
        <Field label="Category">
          <select value={draft.category} onChange={(e) => update({ category: e.target.value })} style={inputStyle}>
            {CATEGORIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Glass">
          <select value={draft.glass} onChange={(e) => update({ glass: e.target.value })} style={inputStyle}>
            {GLASS_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Creator" style={{ marginTop: 18 }}>
        <select
          value={draft.creator_id}
          onChange={(e) => update({ creator_id: e.target.value })}
          style={inputStyle}
        >
          <option value="">— Unattributed</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.venue ? ` · ${c.venue}` : ''}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Drink color (visual identity)" style={{ marginTop: 18 }}>
        <div className="row" style={{ gap: 16 }}>
          <div className="row gap-sm">
            <input
              type="color"
              value={draft.color1}
              onChange={(e) => update({ color1: e.target.value })}
              style={swatchStyle}
            />
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
              HIGHLIGHT
            </span>
          </div>
          <div className="row gap-sm">
            <input
              type="color"
              value={draft.color2}
              onChange={(e) => update({ color2: e.target.value })}
              style={swatchStyle}
            />
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
              SHADOW
            </span>
          </div>
        </div>
      </Field>

      <Field label="Photo" style={{ marginTop: 18 }}>
        {draft.photo_data_url ? (
          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              padding: 12,
              border: '1px solid var(--line-1)',
              borderRadius: 14,
              background: '#fff',
            }}
          >
            <img
              src={draft.photo_data_url}
              alt="Preview"
              style={{
                width: 72,
                height: 72,
                objectFit: 'cover',
                borderRadius: 10,
                border: '1px solid var(--line-2)',
              }}
            />
            <div className="col" style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {draft.photo_filename}
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
                Attached · ready to upload
              </span>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => update({ photo_data_url: null, photo_filename: null })}
            >
              <Icon name="x" size={12} />
              Remove
            </button>
          </div>
        ) : (
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '28px 20px',
              border: '1.5px dashed var(--line-1)',
              borderRadius: 14,
              background: 'var(--bg-sunken)',
              cursor: 'pointer',
              transition: 'background 120ms, border-color 120ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.background = '#faf3e6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--line-1)'
              e.currentTarget.style.background = 'var(--bg-sunken)'
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#fff',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--accent-ink)',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              <Icon name="share" size={16} />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Attach a photo</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>
              PNG or JPG · drag or click to browse · max 5 MB
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </Field>
    </>
  )
}

export function Field({
  label,
  children,
  style = {},
}: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <label className="panel-title">{label}</label>
      {children}
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid var(--line-1)',
  background: '#fff',
  outline: 'none',
  fontSize: 14,
  width: '100%',
  fontFamily: 'inherit',
}

const swatchStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: '1px solid var(--line-1)',
  cursor: 'pointer',
  padding: 0,
  background: 'transparent',
}
