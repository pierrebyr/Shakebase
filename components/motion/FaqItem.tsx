'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState, type ReactNode } from 'react'

type Props = {
  /** The visible question text. */
  question: string
  /** Expanded answer — can be a string or rich JSX. */
  children: ReactNode
  /** Whether this item starts open. Default false. */
  defaultOpen?: boolean
  /** Class on the root wrapper — matches the old `.faq-item` / `.qa-item` CSS. */
  className?: string
}

// Controlled disclosure that smoothly animates its height on open/close.
// Drops into places that were previously using <details>/<summary> with
// `.faq-item` or `.qa-item` class. The internal markup mirrors the old
// structure so the surrounding CSS keeps working.
export function FaqItem({ question, children, defaultOpen = false, className }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const prefersReduced = useReducedMotion()

  return (
    <div className={className} data-open={open ? 'true' : undefined}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="faq-summary"
      >
        <span>{question}</span>
        <span className="plus">+</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: prefersReduced ? 0 : 0.32,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
