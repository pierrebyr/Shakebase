export type Medal = 'gold' | 'silver' | 'bronze'

export function medalColor(m: Medal): string {
  if (m === 'gold') return '#c49155'
  if (m === 'silver') return '#a8a8a8'
  return '#a66a3d'
}

export function MedalIcon({
  medal = 'gold',
  size = 18,
}: {
  medal?: Medal
  size?: number
}) {
  const c = medalColor(medal)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M8 2h8l2 6h-5l-3 5-3-5H6l2-6z" fill={c} opacity="0.35" />
      <circle cx="12" cy="15" r="5.5" fill={c} />
      <circle cx="12" cy="15" r="5.5" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
      <path
        d="M10.3 15l1.2 1.2 2.3-2.3"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
