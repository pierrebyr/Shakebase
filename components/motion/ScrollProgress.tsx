'use client'

import { motion, useScroll } from 'motion/react'

// Thin amber bar pinned to the top of the viewport that fills as the user
// scrolls the page. Uses raw scrollYProgress — spring-eased bars lag tiny
// wheel deltas and make fast scrolls feel jittery.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        transformOrigin: '0% 50%',
        scaleX: scrollYProgress,
        background: 'linear-gradient(90deg, #c49155, #e8c898)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    />
  )
}
