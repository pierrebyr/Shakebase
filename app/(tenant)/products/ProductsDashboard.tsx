'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bottle } from '@/components/cocktail/Bottle'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import { Icon } from '@/components/icons'

export type Product = {
  id: string
  global_product_id: string
  brand: string
  expression: string
  category: string
  type: string
  abv: number | null
  origin: string | null
  volume_ml: number
  stock: number | null
  par: number | null
  cost_cents: number | null
  menu_price_cents: number | null
  color_hex: string
  image_url: string | null
  tagline: string | null
  tasting_notes: string | null
  provenance: Record<string, string> | null
  used_in: UsedInCocktail[]
}

export type UsedInCocktail = {
  id: string
  name: string
  category: string | null
  venue: string | null
  orb_from: string | null
  orb_to: string | null
}

function dollars(cents: number | null): string {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

export function ProductsDashboard({ products }: { products: Product[] }) {
  const [activeId, setActiveId] = useState<string>(products[0]?.id ?? '')
  const active = products.find((p) => p.id === activeId) ?? products[0]

  if (!active) return null

  const ratio = active.par && active.par > 0 ? (active.stock ?? 0) / active.par : 1
  const statusTone = (active.stock ?? 0) === 0 ? 'crit' : ratio < 1 ? 'warn' : 'ok'
  const statusLabel =
    (active.stock ?? 0) === 0 ? 'Out of stock' : ratio < 1 ? 'Below par' : 'Well stocked'

  const pourSize = 50 // ml
  const poursPerBottle = Math.floor(active.volume_ml / pourSize)
  const costPerPour =
    active.cost_cents != null ? active.cost_cents / poursPerBottle / 100 : null

  return (
    <>
      {/* Selector strip */}
      <div
        className="products-selector"
        style={{
          gridTemplateColumns: `repeat(${products.length}, 1fr)`,
          marginBottom: 32,
        }}
      >
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActiveId(p.id)}
            className="card"
            style={{
              padding: '12px 12px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              border: p.id === activeId ? '1px solid var(--ink-1)' : '1px solid var(--line-1)',
              boxShadow: p.id === activeId ? 'var(--shadow-2)' : 'var(--shadow-1)',
              transform: p.id === activeId ? 'translateY(-2px)' : 'none',
              transition: 'all 200ms ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'var(--bg-elev)',
            }}
          >
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image_url}
                alt={p.expression}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  aspectRatio: '1200 / 1111',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <Bottle color={p.color_hex} w={60} h={130} />
            )}
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              {p.expression}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              {p.type.split(' · ')[0]}
            </div>
          </button>
        ))}
      </div>

      {/* Hero */}
      <div
        className="card fade-up"
        style={{
          padding: 0,
          overflow: 'hidden',
          marginBottom: 24,
          background: `linear-gradient(135deg, ${active.color_hex}, var(--bg) 70%)`,
        }}
        key={active.id}
      >
        <div className="products-hero">
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
              }}
            >
              {active.brand}
              {active.provenance?.batch ? ` · Batch ${active.provenance.batch}` : ''}
            </div>
            <h2
              style={{
                margin: '10px 0 8px',
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: 56,
                lineHeight: 1,
                letterSpacing: '-0.025em',
              }}
            >
              {active.brand} {active.expression}
            </h2>
            {active.tagline && (
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.5,
                  maxWidth: '52ch',
                  color: 'var(--ink-2)',
                  margin: '12px 0 0',
                }}
              >
                {active.tagline}
              </p>
            )}
            <div className="row gap-sm" style={{ marginTop: 24, flexWrap: 'wrap' }}>
              <span className="pill">{active.type}</span>
              {active.abv != null && <span className="pill">{active.abv}% ABV</span>}
              <span className="pill">{active.volume_ml} ml</span>
              {active.origin && (
                <span className="pill">
                  <Icon name="pin" size={11} />
                  {active.origin}
                </span>
              )}
            </div>

            <div className="row gap-sm" style={{ marginTop: 24 }}>
              <Link href={`/products/${active.id}/edit`} className="btn-primary">
                <Icon name="edit" size={13} />
                Edit bottle
              </Link>
              <Link href="/cocktails/new" className="btn-secondary">
                <Icon name="plus" size={13} />
                Use in new cocktail
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', placeItems: 'center' }}>
            {active.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.image_url}
                alt={active.expression}
                decoding="async"
                style={{
                  width: '100%',
                  aspectRatio: '1200 / 1111',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <Bottle color={active.color_hex} w={140} h={300} />
            )}
          </div>
        </div>

        {/* Spec strip */}
        <div className="products-spec-strip">
          {[
            ['Agave', active.provenance?.agave ?? '—'],
            ['ABV', active.abv != null ? `${active.abv}%` : '—'],
            ['Cost', dollars(active.cost_cents)],
            ['Menu price', dollars(active.menu_price_cents)],
            ['On hand', `${active.stock ?? 0} btl`],
            [
              'Used in',
              `${active.used_in.length} spec${active.used_in.length === 1 ? '' : 's'}`,
            ],
          ].map(([k, v]) => (
            <div key={k} className="col">
              <span className="panel-title">{k}</span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 400,
                  marginTop: 4,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary grid */}
      <div className="products-split">
        <div className="card card-pad" style={{ padding: 28 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>
            Tasting notes
          </div>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.55,
              margin: 0,
              color: 'var(--ink-1)',
              maxWidth: '58ch',
            }}
          >
            {active.tasting_notes ?? '—'}
          </p>

          <div className="hr" style={{ margin: '24px 0' }} />

          <div
            className="row"
            style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}
          >
            <span className="panel-title">
              Used in cocktails{' '}
              {active.used_in.length > 0 && (
                <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>
                  · {active.used_in.length}
                </span>
              )}
            </span>
            {active.used_in.length > 6 && (
              <Link
                href={`/cocktails?product=${active.id}`}
                style={{ fontSize: 12, color: 'var(--accent-ink)', fontWeight: 500 }}
              >
                View all →
              </Link>
            )}
          </div>
          {active.used_in.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--ink-4)', padding: '12px 0' }}>
              Not yet on a spec.{' '}
              <Link
                href="/cocktails/new"
                style={{ color: 'var(--accent-ink)', fontWeight: 500 }}
              >
                Draft one →
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {active.used_in.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  href={`/cocktails/${c.id}`}
                  className="row gap-md"
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid var(--line-2)',
                    background: 'var(--bg-sunken)',
                  }}
                >
                  <DrinkOrb
                    from={c.orb_from ?? '#f4efe0'}
                    to={c.orb_to ?? '#c9b89a'}
                    size={32}
                  />
                  <div className="col" style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                      {[c.category, c.venue].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="col" style={{ gap: 14 }}>
          {/* Stock card */}
          <div className="card card-pad" style={{ padding: 22 }}>
            <div
              className="row"
              style={{ justifyContent: 'space-between', marginBottom: 10 }}
            >
              <span
                className="panel-title"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span className={`dot ${statusTone}`} />
                {statusLabel}
              </span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {active.stock ?? 0} / {active.par ?? 0} bottles
              </span>
            </div>
            <div className="bar-track" style={{ height: 8 }}>
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min(100, ratio * 100)}%`,
                  background:
                    statusTone === 'crit'
                      ? 'var(--crit)'
                      : statusTone === 'warn'
                        ? 'var(--warn)'
                        : 'var(--ok)',
                }}
              />
            </div>
            <div className="hr" />
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="col">
                <span className="panel-title">Cost / bottle</span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    marginTop: 4,
                  }}
                >
                  {dollars(active.cost_cents)}
                </span>
              </div>
              <div className="col">
                <span className="panel-title">Cost / pour</span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    marginTop: 4,
                  }}
                >
                  {costPerPour != null ? `$${costPerPour.toFixed(2)}` : '—'}
                </span>
              </div>
              <div className="col">
                <span className="panel-title">Pours / btl</span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    marginTop: 4,
                  }}
                >
                  {poursPerBottle}
                </span>
              </div>
            </div>
          </div>

          {/* Provenance */}
          {active.provenance && (
            <div className="card card-pad" style={{ padding: 22 }}>
              <div className="panel-title" style={{ marginBottom: 12 }}>
                Provenance
              </div>
              <div className="col" style={{ gap: 10 }}>
                {Object.entries(active.provenance).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr',
                      gap: 10,
                      fontSize: 12.5,
                    }}
                  >
                    <span style={{ color: 'var(--ink-4)', textTransform: 'capitalize' }}>
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
