'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'

type Props = {
  /** Full text to type. */
  text: string
  /** Milliseconds per character. Default 28. */
  speedMs?: number
  /** Seconds to wait after entering view before typing starts. Default 0.25. */
  startDelay?: number
  /** Whether to show a blinking caret at the end. Default true. */
  caret?: boolean
  className?: string
  style?: React.CSSProperties
}

// Types out the text one character at a time when the element scrolls into
// view. Respects prefers-reduced-motion (renders the full text instantly).
export function Typewriter({
  text,
  speedMs = 28,
  startDelay = 0.25,
  caret = true,
  className,
  style,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const prefersReduced = useReducedMotion()
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!inView) return
    if (prefersReduced) {
      setShown(text)
      setDone(true)
      return
    }
    let i = 0
    const chars = Array.from(text)
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      if (i >= chars.length) {
        setDone(true)
        return
      }
      setShown(chars.slice(0, i + 1).join(''))
      i++
      timer = setTimeout(tick, speedMs)
    }
    timer = setTimeout(tick, startDelay * 1000)
    return () => clearTimeout(timer)
  }, [inView, text, speedMs, startDelay, prefersReduced])

  return (
    <span ref={ref} className={className} style={style}>
      {shown}
      {caret && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            marginLeft: 2,
            verticalAlign: '-0.15em',
            background: 'currentColor',
            opacity: done ? 0 : 1,
            animation: done ? 'none' : 'tw-blink 0.9s steps(2) infinite',
          }}
        />
      )}
      <style>{`@keyframes tw-blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </span>
  )
}
