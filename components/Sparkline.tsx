type Props = {
  data: number[]
  color?: string
  height?: number
  fill?: boolean
}

// Lightweight SVG sparkline. Auto-scales to its container width (viewBox + preserveAspectRatio)
// so it renders crisply at any card width.
export function Sparkline({ data, color = 'var(--accent)', height = 36, fill = true }: Props) {
  if (data.length < 2) return null
  const w = 200
  const h = height
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pts = data.map<[number, number]>((v, i) => [
    (i / (data.length - 1)) * w,
    h - 4 - ((v - min) / range) * (h - 8),
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${d} L ${w} ${h} L 0 ${h} Z`
  const last = pts[pts.length - 1]!

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height, overflow: 'visible' }}
      preserveAspectRatio="none"
    >
      {fill && <path d={area} fill={color} fillOpacity={0.1} />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  )
}
