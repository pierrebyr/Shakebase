type Props = {
  label: string
  sub?: string
  value: number
  max: number
  accent?: boolean
  // Optional denominator so the row can show percentage share of the full
  // population (e.g. "6%" of all cocktails), not just N / topEntry.
  total?: number
}

export function BarRow({ label, sub, value, max, accent, total }: Props) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const share = total && total > 0 ? (value / total) * 100 : null
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 90px',
        alignItems: 'center',
        gap: 14,
        padding: '10px 0',
      }}
    >
      <div className="col">
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{sub}</span>}
      </div>
      <div
        className="bar-track"
        style={{ height: 6, borderRadius: 999, background: 'var(--bg-sunken)', overflow: 'hidden' }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: accent ? 'var(--accent)' : 'var(--ink-1)',
            borderRadius: 'inherit',
          }}
        />
      </div>
      <div
        className="mono"
        style={{
          fontSize: 11.5,
          color: 'var(--ink-2)',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value.toLocaleString()}
        {share != null && (
          <span style={{ color: 'var(--ink-4)', marginLeft: 6 }}>
            {share < 1 ? '<1' : Math.round(share)}%
          </span>
        )}
      </div>
    </div>
  )
}
