'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'

type Props = {
  /** The final value to count up to. */
  to: number
  /** Starting value. Default 0. */
  from?: number
  /** Duration in seconds. Default 1.2. */
  duration?: number
  /** Decimal places in the rendered value. Default 0 (integer + locale separators). */
  decimals?: number
  /** Prefix (e.g. "$", "€"). */
  prefix?: string
  /** Suffix (e.g. "%", "k"). */
  suffix?: string
  className?: string
  style?: React.CSSProperties
}

// Animates a number from `from` to `to` when the element scrolls into view.
// Server-component safe — all formatting knobs are plain JSON props so the
// component can be rendered from a server page.
export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  style,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const prefersReduced = useReducedMotion()
  const [value, setValue] = useState(from)

  useEffect(() => {
    if (!inView) return
    if (prefersReduced) {
      setValue(to)
      return
    }
    let raf = 0
    const start = performance.now()
    const delta = to - from
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(from + delta * eased)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, prefersReduced, from, to, duration])

  const rendered =
    decimals > 0
      ? value.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(value).toLocaleString('en-US')

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {rendered}
      {suffix}
    </span>
  )
}
