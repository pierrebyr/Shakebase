'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Seconds between each child's reveal. Default 0.06. */
  stagger?: number
  /** Seconds delay before the first child. Default 0. */
  initialDelay?: number
  /** Pixel offset for child entrance. Default 16. */
  distance?: number
  /** Amount of the container that must be in view. Default 0.15. */
  amount?: number
  className?: string
  as?: 'div' | 'ul' | 'ol' | 'section' | 'header' | 'nav'
  style?: React.CSSProperties
}

// Wraps a group of children and reveals each one with a stagger. Each direct
// child automatically becomes a motion.div with fade-up — no need to wrap
// each child in <Reveal>. Use this for lists, card grids, ingredient
// ladders, etc.
export function Stagger({
  children,
  stagger = 0.06,
  initialDelay = 0,
  distance = 16,
  amount = 0.15,
  className,
  as = 'div',
  style,
}: Props) {
  const prefersReduced = useReducedMotion()
  const Container = motion[as] as React.ComponentType<HTMLMotionProps<'div'>>

  return (
    <Container
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: prefersReduced ? 0 : stagger,
            delayChildren: prefersReduced ? 0 : initialDelay,
          },
        },
      }}
    >
      {wrapChildren(children, { distance, prefersReduced: Boolean(prefersReduced) })}
    </Container>
  )
}

// Wrap each top-level child with a motion.div that consumes the parent's
// variants. If the child is already a motion element, users can opt out by
// adding data-stagger-skip.
function wrapChildren(
  children: ReactNode,
  opts: { distance: number; prefersReduced: boolean },
): ReactNode {
  const { distance, prefersReduced } = opts

  return (
    <>
      {Array.isArray(children)
        ? children.map((c, i) => (
            <StaggerItem key={i} distance={distance} prefersReduced={prefersReduced}>
              {c}
            </StaggerItem>
          ))
        : <StaggerItem distance={distance} prefersReduced={prefersReduced}>{children}</StaggerItem>}
    </>
  )
}

function StaggerItem({
  children,
  distance,
  prefersReduced,
}: {
  children: ReactNode
  distance: number
  prefersReduced: boolean
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: prefersReduced ? 0 : distance },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: prefersReduced ? 0 : 0.5, ease: [0.2, 0.7, 0.2, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
