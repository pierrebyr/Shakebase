'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/icons'
import { DrinkOrb } from '@/components/cocktail/DrinkOrb'
import {
  saveProductAction,
  uploadProductImageAction,
  removeProductImageAction,
} from './actions'

export type UsedInRef = {
  id: string
  name: string
  category: string | null
  orb_from: string | null
  orb_to: string | null
  image_url: string | null
}

type Initial = {
  brand: string
  expression: string
  category: string
  abv: number | null
  origin: string
  tagline: string
  tasting_notes: string
  volume_ml: number
  color_hex: string
  image_url: string | null
  provenance: Record<string, string>
  stock: number
  par: number
  cost_cents: number
  menu_price_cents: number
}

type Props = {
  workspaceProductId: string
  globalProductId: string
  initial: Initial
  usedIn: UsedInRef[]
}

export function ProductEditForm({
  workspaceProductId,
  globalProductId,
  initial,
  usedIn,
}: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<Initial>(initial)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof Initial>(key: K, value: Initial[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  const setProv = (key: string, value: string) => {
    setDraft((d) => ({ ...d, provenance: { ...d.provenance, [key]: value } }))
    setDirty(true)
    setSaved(false)
  }

  const handleSave = () => {
    setErr(null)
    const globalPatch: Record<string, unknown> = {}
    const workspacePatch: Record<string, unknown> = {}
    for (const k of [
      'brand',
      'expression',
      'category',
      'abv',
      'origin',
      'tagline',
      'tasting_notes',
      'volume_ml',
      'color_hex',
      'provenance',
    ] as const) {
      if (JSON.stringify(draft[k]) !== JSON.stringify(initial[k])) {
        globalPatch[k] = draft[k]
      }
    }
    for (const k of ['stock', 'par', 'cost_cents', 'menu_price_cents'] as const) {
      if (draft[k] !== initial[k]) workspacePatch[k] = draft[k]
    }

    startTransition(async () => {
      const res = await saveProductAction(
        workspaceProductId,
        globalProductId,
        globalPatch,
        workspacePatch,
      )
      if ('error' in res && res.error) {
        setErr(res.error)
        return
      }
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2400)
      router.refresh()
    })
  }

  const handleDiscard = () => {
    setDraft(initial)
    setDirty(false)
    setErr(null)
  }

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('globalProductId', globalProductId)
    setErr(null)
    const res = await uploadProductImageAction(fd)
    if ('error' in res && res.error) {
      setErr(res.error)
      return
    }
    if ('url' in res && res.url) {
      const url = res.url
      setDraft((d) => ({ ...d, image_url: url }))
      router.refresh()
    }
  }

  const handleRemoveImage = async () => {
    setErr(null)
    const res = await removeProductImageAction(globalProductId)
    if ('error' in res && res.error) {
      setErr(res.error)
      return
    }
    setDraft((d) => ({ ...d, image_url: null }))
    router.refresh()
  }

  const ratio = draft.par > 0 ? draft.stock / draft.par : 1
  const dot = draft.stock === 0 ? 'crit' : ratio < 1 ? 'warn' : 'ok'

  const COLOR_SWATCHES = [
    '#efe6c9', '#ebe8d5', '#e5dfc2', '#dcc48a', '#c99858',
    '#b07a3a', '#8b5a2a', '#f4eadb', '#f0e6cc', '#d9b97a',
  ]

  return (
    <div className="page">
      {/* Sticky edit bar */}
      <div
        style={{
          position: 'sticky',
          top: 88,
          zIndex: 10,
          marginBottom: 28,
          background: 'rgba(253,251,247,0.82)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid var(--line-1)',
          borderRadius: 14,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: 'var(--shadow-1)',
        }}
      >
        <Link href="/products" className="btn-ghost">
          <Icon name="chevron-l" size={13} /> Portfolio
        </Link>
        <div style={{ width: 1, height: 20, background: 'var(--line-1)' }} />
        <div className="col" style={{ flex: 1, minWidth: 0 }}>
          <span className="panel-title">Editing</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1.2 }}>
            {draft.brand} {draft.expression}
          </span>
        </div>
        {saved && (
          <span
            className="pill"
            style={{
              background: 'rgba(95,181,138,0.12)',
              color: 'var(--ok)',
              border: '1px solid rgba(95,181,138,0.3)',
            }}
          >
            <Icon name="check" size={11} /> Saved
          </span>
        )}
        {err && (
          <span className="mono" style={{ fontSize: 11, color: 'var(--crit)' }}>
            {err}
          </span>
        )}
        {dirty && !saved && (
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--warn)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Unsaved
          </span>
        )}
        <button
          type="button"
          className="btn-ghost"
          onClick={handleDiscard}
          disabled={!dirty || pending}
        >
          Discard
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={!dirty || pending}
        >
          <Icon name="check" size={13} /> {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="page-head">
        <div className="page-kicker">Edit bottle</div>
        <h1 className="page-title">{draft.brand} {draft.expression}.</h1>
        <p className="page-sub">
          Update identity, pricing, stock, and tasting notes. Changes apply across
          the dashboard immediately.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 'var(--density-gap)',
          alignItems: 'start',
        }}
        className="pe-grid"
      >
        {/* LEFT — form */}
        <div className="col" style={{ gap: 20 }}>
          {/* Identity */}
          <section className="card card-pad">
            <div className="panel-title" style={{ marginBottom: 14 }}>
              Identity
            </div>
            <div className="pe-grid-2">
              <Field label="Brand" value={draft.brand} onChange={(v) => set('brand', v)} />
              <Field
                label="Expression"
                value={draft.expression}
                onChange={(v) => set('expression', v)}
              />
              <Field
                label="Category"
                value={draft.category}
                onChange={(v) => set('category', v)}
              />
              <Field label="Origin" value={draft.origin} onChange={(v) => set('origin', v)} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Field
                label="Tagline"
                value={draft.tagline}
                onChange={(v) => set('tagline', v)}
                placeholder="A short, evocative one-liner."
              />
            </div>
          </section>

          {/* Spec */}
          <section className="card card-pad">
            <div className="panel-title" style={{ marginBottom: 14 }}>
              Spec
            </div>
            <div className="pe-grid-3">
              <Field
                label="ABV (%)"
                type="number"
                step="0.1"
                value={draft.abv ?? ''}
                onChange={(v) => set('abv', v === '' ? null : Number(v))}
                mono
                suffix="%"
              />
              <Field
                label="Volume"
                type="number"
                value={draft.volume_ml}
                onChange={(v) => set('volume_ml', Number(v))}
                mono
                suffix="ml"
              />
              <Field
                label="Agave source"
                value={draft.provenance?.agave ?? ''}
                onChange={(v) => setProv('agave', v)}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <Field
                label="Batch number"
                value={draft.provenance?.batch ?? ''}
                onChange={(v) => setProv('batch', v)}
                mono
                placeholder="SB-XXXX"
              />
            </div>
          </section>

          {/* Commerce */}
          <section className="card card-pad">
            <div className="panel-title" style={{ marginBottom: 14 }}>
              Pricing &amp; stock
            </div>
            <div className="pe-grid-4">
              <Field
                label="Cost / bottle"
                type="number"
                value={draft.cost_cents / 100}
                onChange={(v) => set('cost_cents', Math.round(Number(v) * 100))}
                mono
                prefix="$"
              />
              <Field
                label="Menu price"
                type="number"
                value={draft.menu_price_cents / 100}
                onChange={(v) => set('menu_price_cents', Math.round(Number(v) * 100))}
                mono
                prefix="$"
              />
              <Field
                label="On hand"
                type="number"
                value={draft.stock}
                onChange={(v) => set('stock', Number(v))}
                mono
                suffix="btl"
              />
              <Field
                label="Par level"
                type="number"
                value={draft.par}
                onChange={(v) => set('par', Number(v))}
                mono
                suffix="btl"
              />
            </div>
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--bg-sunken)',
                border: '1px solid var(--line-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span className={`dot ${dot}`} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {draft.stock === 0
                  ? 'Out of stock'
                  : ratio < 1
                    ? 'Below par — reorder recommended'
                    : 'Well stocked'}
              </span>
              <div
                className="bar-track"
                style={{ flex: 1, height: 6, marginLeft: 'auto', maxWidth: 220 }}
              >
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.min(100, ratio * 100)}%`,
                    background:
                      dot === 'crit'
                        ? 'var(--crit)'
                        : dot === 'warn'
                          ? 'var(--warn)'
                          : 'var(--ok)',
                  }}
                />
              </div>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 70, textAlign: 'right' }}
              >
                {draft.stock} / {draft.par}
              </span>
            </div>
          </section>

          {/* Tasting notes */}
          <section className="card card-pad">
            <div className="panel-title" style={{ marginBottom: 14 }}>
              Tasting notes
            </div>
            <textarea
              className="input"
              style={{
                width: '100%',
                minHeight: 140,
                padding: 14,
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                lineHeight: 1.55,
                resize: 'vertical',
                border: '1px solid var(--line-1)',
                borderRadius: 10,
                background: '#fff',
              }}
              value={draft.tasting_notes}
              onChange={(e) => set('tasting_notes', e.target.value)}
              placeholder="Nose, palate, finish — how this bottle drinks."
            />
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                color: 'var(--ink-4)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: 8,
              }}
            >
              {draft.tasting_notes.length} characters · aim for 40–80 words
            </div>
          </section>
        </div>

        {/* RIGHT — preview + image + used in */}
        <div
          className="col"
          style={{ position: 'sticky', top: 172, gap: 20 }}
        >
          {/* Live preview */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              background: `linear-gradient(150deg, ${draft.color_hex}, #faf8f4 75%)`,
            }}
          >
            <div style={{ padding: '32px 24px 20px', textAlign: 'center' }}>
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-4)',
                  marginBottom: 10,
                }}
              >
                Live preview
              </div>
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  minHeight: 280,
                  padding: '0 12px',
                }}
              >
                {draft.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={draft.image_url}
                    alt={`${draft.brand} ${draft.expression}`}
                    style={{
                      width: '100%',
                      maxWidth: 280,
                      aspectRatio: '1200 / 1111',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 140,
                      height: 260,
                      borderRadius: 12,
                      background: draft.color_hex,
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  letterSpacing: '-0.02em',
                  marginTop: 6,
                }}
              >
                {draft.expression}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-4)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginTop: 4,
                }}
              >
                {draft.category}
              </div>
            </div>

            {/* Color swatches (fallback tint when no image) */}
            <div
              style={{
                background: 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(14px)',
                padding: '14px 20px',
                borderTop: '1px solid var(--line-1)',
              }}
            >
              <div className="panel-title" style={{ marginBottom: 10 }}>
                Background tint
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('color_hex', c)}
                    aria-label={`Swatch ${c}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: c,
                      border:
                        draft.color_hex === c
                          ? '2px solid var(--ink-1)'
                          : '1px solid rgba(0,0,0,0.08)',
                      boxShadow: draft.color_hex === c ? '0 0 0 3px var(--bg)' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    border: '1px dashed var(--line-1)',
                    borderRadius: 999,
                    cursor: 'pointer',
                    color: 'var(--ink-3)',
                  }}
                >
                  <input
                    type="color"
                    value={draft.color_hex}
                    onChange={(e) => set('color_hex', e.target.value)}
                    style={{
                      width: 18,
                      height: 18,
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  />
                  Custom
                </label>
              </div>
            </div>
          </div>

          {/* Bottle photo upload */}
          <div className="card card-pad">
            <div className="panel-title" style={{ marginBottom: 10 }}>
              Bottle photo
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'
              }}
              onDragLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = ''
              }}
              onDrop={(e) => {
                e.preventDefault()
                ;(e.currentTarget as HTMLDivElement).style.borderColor = ''
                handleFile(e.dataTransfer.files[0])
              }}
              style={{
                border: '1.5px dashed var(--line-1)',
                borderRadius: 12,
                padding: draft.image_url ? 0 : '28px 16px',
                minHeight: 140,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                background: 'var(--bg-sunken)',
                overflow: 'hidden',
                transition: 'border-color 160ms',
              }}
            >
              {draft.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={draft.image_url}
                  alt="Bottle preview"
                  style={{ maxHeight: 220, maxWidth: '100%', display: 'block' }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Icon name="plus" size={22} />
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 8 }}>
                    Drop a bottle photo
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: 'var(--ink-4)',
                      letterSpacing: '0.08em',
                      marginTop: 4,
                    }}
                  >
                    PNG or JPG · square-ish preferred
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
            {draft.image_url && (
              <div className="row gap-sm" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => fileRef.current?.click()}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleRemoveImage}
                  style={{ color: 'var(--crit)' }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Used in */}
          {usedIn.length > 0 && (
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 12 }}>
                On {usedIn.length} cocktail spec{usedIn.length === 1 ? '' : 's'}
              </div>
              <div className="col" style={{ gap: 8 }}>
                {usedIn.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cocktails/${c.id}`}
                    className="row gap-sm"
                    style={{
                      padding: 8,
                      borderRadius: 10,
                      background: 'var(--bg-sunken)',
                      border: '1px solid transparent',
                      textAlign: 'left',
                    }}
                  >
                    {c.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={c.image_url}
                        alt={c.name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <DrinkOrb
                        from={c.orb_from ?? '#f4efe0'}
                        to={c.orb_to ?? '#c9b89a'}
                        size={32}
                      />
                    )}
                    <div className="col" style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                        {c.category ?? '—'}
                      </span>
                    </div>
                    <Icon name="chevron-r" size={12} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Small field primitive
function Field({
  label,
  value,
  onChange,
  type = 'text',
  step,
  mono,
  prefix,
  suffix,
  placeholder,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  step?: string
  mono?: boolean
  prefix?: string
  suffix?: string
  placeholder?: string
}) {
  const [focus, setFocus] = useState(false)
  return (
    <label className="col" style={{ gap: 6 }}>
      <span className="panel-title">{label}</span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          border: `1px solid ${focus ? 'var(--ink-1)' : 'var(--line-1)'}`,
          borderRadius: 10,
          background: '#fff',
          transition: 'border-color 140ms',
          boxShadow: focus ? '0 0 0 3px rgba(0,0,0,0.04)' : 'none',
        }}
      >
        {prefix && (
          <span
            className="mono"
            style={{ padding: '0 0 0 12px', color: 'var(--ink-4)', fontSize: 13 }}
          >
            {prefix}
          </span>
        )}
        <input
          type={type}
          step={step}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 14,
            fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
            color: 'var(--ink-1)',
          }}
        />
        {suffix && (
          <span
            className="mono"
            style={{ padding: '0 12px 0 0', color: 'var(--ink-4)', fontSize: 12 }}
          >
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}
