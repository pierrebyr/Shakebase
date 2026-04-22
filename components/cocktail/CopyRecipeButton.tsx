'use client'

import { useState } from 'react'
import { Icon } from '@/components/icons'

// navigator.clipboard is only available in secure contexts (HTTPS or
// strict localhost), so on *.lvh.me:3000 dev it's undefined. Fall back
// to a hidden textarea + execCommand when the async API is missing.
async function writeTextWithFallback(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // permission or focus denied — fall through
    }
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.top = '-9999px'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  try {
    const ok = document.execCommand('copy')
    if (!ok) throw new Error('execCommand returned false')
  } finally {
    document.body.removeChild(ta)
  }
}

export function CopyRecipeButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')

  async function copy() {
    try {
      await writeTextWithFallback(text)
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="btn-secondary"
      style={{
        color: state === 'copied' ? 'var(--ok)' : state === 'error' ? 'var(--crit)' : undefined,
        borderColor: state === 'copied' ? '#bfd9ca' : undefined,
      }}
    >
      <Icon name={state === 'copied' ? 'check' : 'share'} size={13} />
      {state === 'copied' ? 'Copied' : state === 'error' ? 'Try again' : 'Copy recipe'}
    </button>
  )
}
