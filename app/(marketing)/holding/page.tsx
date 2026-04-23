import type { Metadata } from 'next'
import { HoldingPage } from '../HoldingPage'

export const metadata: Metadata = {
  title: 'ShakeBase — Private beta',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function HoldingRoute() {
  return <HoldingPage />
}
