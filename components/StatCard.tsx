import { Sparkline } from './Sparkline'

type Props = {
  kicker: string
  value: string | number
  delta?: number
  sub?: string
  accent?: boolean
  sparkData?: number[]
}

export function StatCard({ kicker, value, delta, sub, accent = false, sparkData }: Props) {
  return (
    <div
      className="card card-pad fade-up"
      style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 22, minHeight: 138 }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="panel-title">{kicker}</div>
        {typeof delta === 'number' && delta !== 0 && (
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: delta > 0 ? 'var(--ok)' : 'var(--crit)',
            }}
          >
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div
        className="stat-big"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 40,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: accent ? 'var(--accent-ink)' : 'var(--ink-1)',
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{sub}</div>}
      {sparkData && sparkData.length > 1 && (
        <div style={{ marginTop: 'auto' }}>
          <Sparkline
            data={sparkData}
            color={accent ? 'var(--accent)' : 'var(--ink-1)'}
            height={28}
          />
        </div>
      )}
    </div>
  )
}
