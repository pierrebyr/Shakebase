import { ScrollProgress } from '@/components/motion/ScrollProgress'
import './marketing.css'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollProgress />
      {children}
    </>
  )
}
