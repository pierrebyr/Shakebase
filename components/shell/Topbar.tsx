import Link from 'next/link'
import { Icon } from '@/components/icons'
import { NotificationsBell } from './NotificationsBell'
import { TopbarSearch } from './TopbarSearch'
import { MobileNavToggle } from './MobileNavToggle'

type Props = {
  crumbs: string[]
}

export function Topbar({ crumbs }: Props) {
  return (
    <div className="topbar">
      <MobileNavToggle />
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <span className="sep"> / </span>}
            {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
          </span>
        ))}
      </div>
      <TopbarSearch />
      <div className="top-actions">
        <NotificationsBell />
        <Link href="/settings" className="icon-btn" aria-label="Settings">
          <Icon name="settings" size={15} />
        </Link>
        <Link href="/cocktails/new" className="btn-primary">
          <Icon name="plus" size={14} />
          New Cocktail
        </Link>
      </div>
    </div>
  )
}
