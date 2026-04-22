'use client'

import { useActionState, useEffect, useState } from 'react'
import { Icon } from '@/components/icons'
import { updateAppearanceAction, type AppearanceResult } from './actions'

const initialState: AppearanceResult = { ok: true }

type Density = 'comfortable' | 'compact'
type Typography = 'default' | 'editorial' | 'technical'
type Accent = 'amber' | 'agave' | 'hibiscus' | 'lagoon'

const ACCENT_META: Record<Accent, { label: string; hex: string }> = {
  amber: { label: 'Amber', hex: '#c49155' },
  agave: { label: 'Agave', hex: '#5a7d62' },
  hibiscus: { label: 'Hibiscus', hex: '#8c5a7f' },
  lagoon: { label: 'Lagoon', hex: '#2f5e7a' },
}

const TYPO_LABEL: Record<Typography, string> = {
  default: 'Default · Fraunces + Inter',
  editorial: 'Editorial · Fraunces + Inter',
  technical: 'Technical · Instrument + IBM Plex',
}

type Props = {
  initial: {
    density: Density
    typography: Typography
    accent: Accent
    reduceMotion: boolean
  }
}

export function AppearanceForm({ initial }: Props) {
  const [density, setDensity] = useState<Density>(initial.density)
  const [typography, setTypography] = useState<Typography>(initial.typography)
  const [accent, setAccent] = useState<Accent>(initial.accent)
  const [reduceMotion, setReduceMotion] = useState(initial.reduceMotion)
  const [state, action, pending] = useActionState(updateAppearanceAction, initialState)

  // Live preview: apply changes to <html> as the user tweaks.
  useEffect(() => {
    const html = document.documentElement
    html.dataset.density = density
    html.dataset.type = typography
    html.dataset.accent = accent
    html.dataset.reduceMotion = reduceMotion ? 'true' : 'false'
  }, [density, typography, accent, reduceMotion])

  return (
    <form action={action} className="card card-pad" style={{ padding: 28, maxWidth: 720 }}>
      <div className="panel-title" style={{ marginBottom: 18 }}>
        Appearance
      </div>

      <div className="col" style={{ gap: 24 }}>
        {/* Density */}
        <SettingRow
          label="Density"
          desc="Comfortable fits more breathing room; Compact packs more on screen."
        >
          <input type="hidden" name="density" value={density} />
          <Segmented
            value={density}
            options={['comfortable', 'compact']}
            onChange={(v) => setDensity(v as Density)}
          />
        </SettingRow>

        {/* Typography */}
        <SettingRow
          label="Typography"
          desc="Technical pairs Instrument Serif with IBM Plex for data-heavy surfaces."
        >
          <input type="hidden" name="typography" value={typography} />
          <div className="col" style={{ gap: 6 }}>
            {(['default', 'editorial', 'technical'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypography(t)}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1px solid ${typography === t ? 'var(--ink-1)' : 'var(--line-1)'}`,
                  background: typography === t ? 'var(--bg-sunken)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--ink-1)',
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 10.5, color: 'var(--ink-4)' }}
                >
                  {TYPO_LABEL[t]}
                </div>
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Accent */}
        <SettingRow label="Accent colour" desc="Tints buttons, highlights, and focus rings.">
          <input type="hidden" name="accent" value={accent} />
          <div className="row gap-sm">
            {(Object.keys(ACCENT_META) as Accent[]).map((a) => {
              const meta = ACCENT_META[a]
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccent(a)}
                  title={meta.label}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: meta.hex,
                    border: accent === a ? '2px solid var(--ink-1)' : '2px solid transparent',
                    boxShadow: '0 0 0 2px #fff inset, 0 1px 3px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                  }}
                />
              )
            })}
          </div>
        </SettingRow>

        {/* Reduce motion */}
        <SettingRow
          label="Reduce motion"
          desc="Disables page transitions and hover animations. Respects your system preference."
        >
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              name="reduce_motion"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-ink)' }}
            />
            <span style={{ fontSize: 13 }}>{reduceMotion ? 'Reduced' : 'Full motion'}</span>
          </label>
        </SettingRow>

        {!state.ok && (
          <div
            role="alert"
            style={{
              fontSize: 12.5,
              color: 'var(--crit)',
              background: '#fdf0f0',
              border: '1px solid #f0cccc',
              padding: '8px 12px',
              borderRadius: 10,
            }}
          >
            {state.error}
          </div>
        )}

        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="submit" className="btn-primary" disabled={pending}>
            <Icon name="check" size={13} />
            {pending ? 'Saving…' : 'Save appearance'}
          </button>
        </div>
      </div>
    </form>
  )
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        padding: '18px 0',
        borderBottom: '1px solid var(--line-2)',
        alignItems: 'flex-start',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{label}</div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--ink-3)',
            lineHeight: 1.5,
            maxWidth: '44ch',
          }}
        >
          {desc}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (v: string) => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--bg-sunken)',
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.04em',
            textTransform: 'capitalize',
            background: value === o ? '#fff' : 'transparent',
            color: value === o ? 'var(--ink-1)' : 'var(--ink-3)',
            boxShadow: value === o ? 'var(--shadow-1)' : 'none',
            cursor: 'pointer',
          }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
