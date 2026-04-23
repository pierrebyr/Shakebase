import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import {
  updateProductAction,
  deleteProductAction,
  mergeProductAction,
} from './actions'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}

type Product = {
  id: string
  brand: string
  expression: string
  category: string | null
  abv: number | null
  origin: string | null
  tagline: string | null
  description: string | null
  tasting_notes: string | null
  volume_ml: number | null
  image_url: string | null
  color_hex: string | null
  suggested_cost_cents: number | null
  suggested_price_cents: number | null
  created_at: string | null
}

type CocktailRef = {
  id: string
  name: string
  slug: string
  workspace_id: string
  workspaces: { id: string; name: string; slug: string } | null
}

type WorkspaceStock = {
  id: string
  workspace_id: string
  stock: number | null
  par: number | null
  workspaces: { id: string; name: string; slug: string } | null
}

export default async function AdminProductEditPage({ params, searchParams }: Props) {
  const { id } = await params
  const { saved } = await searchParams

  const admin = createAdminClient()

  const [{ data: productRow }, { data: cocktailRows }, { data: stockRows }, { data: allProducts }] =
    await Promise.all([
      admin
        .from('global_products')
        .select(
          'id, brand, expression, category, abv, origin, tagline, description, tasting_notes, volume_ml, image_url, color_hex, suggested_cost_cents, suggested_price_cents, created_at',
        )
        .eq('id', id)
        .maybeSingle(),
      admin
        .from('cocktails')
        .select('id, name, slug, workspace_id, workspaces(id, name, slug)')
        .eq('base_product_id', id)
        .limit(100),
      admin
        .from('workspace_products')
        .select('id, workspace_id, stock, par, workspaces(id, name, slug)')
        .eq('global_product_id', id)
        .limit(100),
      admin
        .from('global_products')
        .select('id, brand, expression, category')
        .neq('id', id)
        .order('brand')
        .order('expression')
        .limit(1000),
    ])

  const product = productRow as Product | null
  if (!product) notFound()
  const cocktails = (cocktailRows ?? []) as unknown as CocktailRef[]
  const stocks = (stockRows ?? []) as unknown as WorkspaceStock[]
  const mergeCandidates = (allProducts ?? []) as {
    id: string
    brand: string
    expression: string
    category: string | null
  }[]

  const usageTotal = cocktails.length + stocks.length
  const canDelete = usageTotal === 0

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            <Link href="/admin/catalog" style={{ color: 'var(--op-ink-3)' }}>
              ← Catalog
            </Link>
          </div>
          <h1 className="op-title">
            {product.brand} <span className="it">· {product.expression}</span>
          </h1>
          <p className="op-sub">
            Canonical product · stocked by {stocks.length} workspace
            {stocks.length === 1 ? '' : 's'} · referenced by {cocktails.length} cocktail
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
        {/* ── Edit form ──────────────────────── */}
        <form action={updateProductAction} className="op-card" style={{ padding: 22 }}>
          <input type="hidden" name="id" value={product.id} />

          <Section title="Identity">
            <Row>
              <Field label="Brand" required>
                <input
                  name="brand"
                  defaultValue={product.brand}
                  required
                  minLength={1}
                  className="op-input"
                />
              </Field>
              <Field label="Expression" required>
                <input
                  name="expression"
                  defaultValue={product.expression}
                  required
                  minLength={1}
                  className="op-input"
                />
              </Field>
            </Row>
            <Row>
              <Field label="Category" required>
                <input
                  name="category"
                  defaultValue={product.category ?? ''}
                  placeholder="Tequila, Mezcal, Rum…"
                  required
                  className="op-input"
                />
              </Field>
              <Field label="ABV %">
                <input
                  name="abv"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue={product.abv ?? ''}
                  className="op-input"
                />
              </Field>
            </Row>
            <Row>
              <Field label="Origin">
                <input
                  name="origin"
                  defaultValue={product.origin ?? ''}
                  placeholder="Jalisco, Mexico"
                  className="op-input"
                />
              </Field>
              <Field label="Volume (ml)">
                <input
                  name="volume_ml"
                  type="number"
                  min="0"
                  max="5000"
                  defaultValue={product.volume_ml ?? ''}
                  className="op-input"
                />
              </Field>
            </Row>
          </Section>

          <Section title="Copy">
            <Field label="Tagline">
              <input
                name="tagline"
                defaultValue={product.tagline ?? ''}
                maxLength={200}
                className="op-input"
              />
            </Field>
            <Field label="Description">
              <textarea
                name="description"
                defaultValue={product.description ?? ''}
                maxLength={1000}
                rows={3}
                className="op-input"
              />
            </Field>
            <Field label="Tasting notes">
              <textarea
                name="tasting_notes"
                defaultValue={product.tasting_notes ?? ''}
                maxLength={1000}
                rows={3}
                className="op-input"
              />
            </Field>
          </Section>

          <Section title="Visual">
            <Row>
              <Field label="Image URL">
                <input
                  name="image_url"
                  defaultValue={product.image_url ?? ''}
                  placeholder="https://…"
                  className="op-input"
                />
              </Field>
              <Field label="Color hex">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    name="color_hex"
                    defaultValue={product.color_hex ?? ''}
                    placeholder="#efe6c9"
                    className="op-input"
                    style={{ flex: 1 }}
                  />
                  {product.color_hex && (
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: product.color_hex,
                        border: '1px solid var(--op-line)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              </Field>
            </Row>
          </Section>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              borderTop: '1px solid var(--op-line)',
              paddingTop: 18,
              marginTop: 8,
            }}
          >
            <Link href="/admin/catalog" className="op-btn ghost">
              Cancel
            </Link>
            <button type="submit" className="op-btn primary">
              Save changes
            </button>
          </div>
        </form>

        {/* ── Side panel: usage + danger zone ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Preview */}
          {product.image_url && (
            <div className="op-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '3 / 4', background: product.color_hex ?? 'var(--op-surface-2)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_url}
                  alt={`${product.brand} ${product.expression}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {/* Usage */}
          <div className="op-card" style={{ padding: 0 }}>
            <div className="op-card-head">
              <h3>Usage</h3>
              <span className="eyebrow" style={{ fontSize: 9.5 }}>
                {usageTotal} total
              </span>
            </div>
            <div style={{ padding: '6px 0' }}>
              <div style={{ padding: '10px 18px', fontSize: 12, color: 'var(--op-ink-3)' }}>
                Stocked by {stocks.length} workspace{stocks.length === 1 ? '' : 's'}
              </div>
              {stocks.slice(0, 8).map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/activity/${s.workspace_id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 18px',
                    fontSize: 12.5,
                    borderTop: '1px solid var(--op-line)',
                    color: 'var(--op-ink-1)',
                  }}
                >
                  <span>{s.workspaces?.name ?? '—'}</span>
                  <span
                    className="mono"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--op-ink-4)',
                    }}
                  >
                    stock {s.stock ?? 0}
                  </span>
                </Link>
              ))}

              <div
                style={{
                  padding: '10px 18px',
                  fontSize: 12,
                  color: 'var(--op-ink-3)',
                  borderTop: '1px solid var(--op-line)',
                  marginTop: 6,
                }}
              >
                Referenced by {cocktails.length} cocktail{cocktails.length === 1 ? '' : 's'}
              </div>
              {cocktails.slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/activity/${c.workspace_id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 18px',
                    fontSize: 12.5,
                    borderTop: '1px solid var(--op-line)',
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
              ))}
              {usageTotal === 0 && (
                <div
                  className="op-empty"
                  style={{ padding: '24px 18px', textAlign: 'center' }}
                >
                  Not used yet.
                </div>
              )}
            </div>
          </div>

          {/* Merge into another */}
          <form action={mergeProductAction} className="op-card" style={{ padding: 16 }}>
            <input type="hidden" name="source_id" value={product.id} />
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Merge into
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--op-ink-3)', marginBottom: 10 }}>
              Re-points every cocktail, recipe line, and workspace stock from this product to
              the target, then deletes this row. Irreversible.
            </div>
            <select
              name="target_id"
              defaultValue=""
              className="op-input"
              required
              style={{ marginBottom: 10 }}
            >
              <option value="" disabled>
                Pick a canonical product…
              </option>
              {mergeCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand} · {c.expression}
                  {c.category ? ` (${c.category})` : ''}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="op-btn"
              style={{ width: '100%' }}
              formNoValidate
            >
              Merge &amp; delete this row
            </button>
          </form>

          {/* Danger zone */}
          <form action={deleteProductAction} className="op-card" style={{ padding: 16 }}>
            <input type="hidden" name="id" value={product.id} />
            <div className="eyebrow" style={{ color: 'var(--op-crit)', marginBottom: 6 }}>
              Danger zone
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--op-ink-2)', marginBottom: 12 }}>
              Permanently remove this product from the canonical catalog. Only possible when
              zero cocktails and zero workspaces reference it.
            </div>
            <button
              type="submit"
              className="op-btn danger"
              disabled={!canDelete}
              style={{ width: '100%', opacity: canDelete ? 1 : 0.5, cursor: canDelete ? 'pointer' : 'not-allowed' }}
              formNoValidate
            >
              {canDelete ? 'Delete product' : `Delete blocked — ${usageTotal} reference(s)`}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        className="eyebrow"
        style={{
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid var(--op-line)',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
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
