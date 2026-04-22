'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

type Props = {
  children: ReactNode
  /** Animation direction for the initial offset. Default 'up'. */
  from?: Direction
  /** Pixel offset before reveal. Default 20. */
  distance?: number
  /** Seconds delay before this element reveals. */
  delay?: number
  /** Animation duration in seconds. Default 0.55. */
  duration?: number
  /** Fraction of element that must be in view. Default 0.15. */
  amount?: number
  /** Re-run every time the element enters view (default false — once only). */
  replay?: boolean
  className?: string
  as?: 'div' | 'span' | 'li' | 'section' | 'article' | 'header' | 'footer'
  style?: React.CSSProperties
}

function offset(from: Direction, d: number) {
  switch (from) {
    case 'up':
      return { y: d, x: 0 }
    case 'down':
      return { y: -d, x: 0 }
    case 'left':
      return { x: d, y: 0 }
    case 'right':
      return { x: -d, y: 0 }
    default:
      return { x: 0, y: 0 }
  }
}

// Core reveal-on-scroll. Use for individual elements. For a group of items
// that should stagger, wrap the list in <Stagger>.
export function Reveal({
  children,
  from = 'up',
  distance = 20,
  delay = 0,
  duration = 0.55,
  amount = 0.15,
  replay = false,
  className,
  as = 'div',
  style,
}: Props) {
  const prefersReduced = useReducedMotion()
  const { x, y } = prefersReduced ? { x: 0, y: 0 } : offset(from, distance)

  const MotionTag = motion[as] as React.ComponentType<HTMLMotionProps<'div'>>

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: !replay, amount }}
      transition={{
        duration: prefersReduced ? 0 : duration,
        delay: prefersReduced ? 0 : delay,
        ease: [0.2, 0.7, 0.2, 1],
      }}
    >
      {children}
    </MotionTag>
  )
}
