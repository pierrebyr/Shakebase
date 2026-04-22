import { DrinkOrb } from './DrinkOrb'

type Props = {
  from: string
  to: string
  orbs: { from: string; to: string }[]
  height?: number | 'fill'
}

// Cover card for a collection: gradient background with up to 4 drink-orbs
// offset like trophies at the bottom-right, overflowing past the edge.
export function CollectionCover({ from, to, orbs, height = 180 }: Props) {
  const shown = orbs.slice(0, 4)
  const fill = height === 'fill'
  return (
    <div
      style={{
        position: 'relative',
        height: fill ? '100%' : height,
        minHeight: fill ? 200 : undefined,
        background: `radial-gradient(120% 100% at 30% 25%, ${from}, ${to} 80%)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: 20,
          bottom: 16,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {shown.map((o, i) => (
          <div
            key={i}
            style={{
              marginLeft: i === 0 ? 0 : -14,
              transform: `translateY(${-i * 4}px)`,
              zIndex: shown.length - i,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
            }}
          >
            <DrinkOrb from={o.from} to={o.to} size={56 - i * 4} ring />
          </div>
        ))}
      </div>
    </div>
  )
}
