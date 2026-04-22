'use client'

import { useEffect } from 'react'

type Props = {
  density: string
  typography: string
  accent: string
  reduceMotion: boolean
}

// Applies the workspace's appearance settings to the <html> element on mount.
// Kept client-side to avoid a flash when the settings differ from the SSR defaults.
export function ThemeApplier({ density, typography, accent, reduceMotion }: Props) {
  useEffect(() => {
    const html = document.documentElement
    html.dataset.density = density
    html.dataset.type = typography
    html.dataset.accent = accent
    html.dataset.reduceMotion = reduceMotion ? 'true' : 'false'
  }, [density, typography, accent, reduceMotion])
  return null
}
