import { ScrollProgress } from '@/components/motion/ScrollProgress'
import './marketing.css'

// The public-marketing lockdown runs in middleware (see middleware.ts —
// it rewrites non-super-admin, non-allowlisted paths to /holding). The
// layout stays dumb on purpose so soft-navigation never accidentally
// renders the wrong content from a cached layout.

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollProgress />
      {children}
    </>
  )
}
