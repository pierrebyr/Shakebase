import type { CSSProperties } from 'react'

type Props = {
  from: string
  to: string
  size?: number
  ring?: boolean
  style?: CSSProperties
}

export function DrinkOrb({ from, to, size = 40, ring = false, style = {} }: Props) {
  const cssVars = {
    '--orb-from': from,
    '--orb-to': to,
  } as CSSProperties

  return (
    <div
      className="drink-orb"
      style={{
        width: size,
        height: size,
        ...cssVars,
        boxShadow: ring
          ? `0 6px 18px ${to}40, inset 0 1px 1px rgba(255,255,255,0.3)`
          : `0 3px 10px ${to}30`,
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
