type Props = {
  color: string
  w?: number
  h?: number
}

// Minimal bottle silhouette — body + neck + cap + label with a subtle
// crest dot and two text-strip lines. Scales with w/h.
export function Bottle({ color, w = 64, h = 140 }: Props) {
  const gid = `bg-${color.replace('#', '')}-${w}`
  return (
    <svg viewBox="0 0 64 140" width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0.7" />
          <stop offset="0.5" stopColor={color} stopOpacity="1" />
          <stop offset="1" stopColor={color} stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* body */}
      <path
        d="M20 30 L20 42 Q14 46 14 58 L14 126 Q14 132 20 132 L44 132 Q50 132 50 126 L50 58 Q50 46 44 42 L44 30 Z"
        fill={`url(#${gid})`}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="0.8"
      />
      {/* neck */}
      <rect
        x="26"
        y="14"
        width="12"
        height="18"
        rx="1.2"
        fill={color}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="0.8"
      />
      {/* cap */}
      <rect x="25" y="6" width="14" height="9" rx="1" fill="#1a1a1a" />
      {/* highlight */}
      <path
        d="M18 58 Q18 48 22 46 L22 126"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* label */}
      <rect
        x="17"
        y="70"
        width="30"
        height="44"
        fill="rgba(255,255,255,0.9)"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="0.5"
      />
      <circle cx="32" cy="82" r="3" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="0.8" />
      <line x1="22" y1="92" x2="42" y2="92" stroke="rgba(0,0,0,0.45)" strokeWidth="0.8" />
      <line x1="22" y1="98" x2="38" y2="98" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
      <line x1="22" y1="104" x2="40" y2="104" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
    </svg>
  )
}
