import Link from 'next/link'
import { Icon } from '@/components/icons'

export default function TenantNotFound() {
  return (
    <div className="page fade-up" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div className="page-kicker">404</div>
        <h1 className="page-title">We couldn&rsquo;t find that.</h1>
        <p className="page-sub">
          The page, cocktail, or collection you were after isn&rsquo;t here — it may have been
          archived, renamed, or never existed on this workspace.
        </p>
      </div>

      <div className="row gap-sm">
        <Link href="/dashboard" className="btn-primary">
          <Icon name="home" size={13} /> Overview
        </Link>
        <Link href="/cocktails" className="btn-secondary">
          Browse the library
        </Link>
      </div>
    </div>
  )
}
