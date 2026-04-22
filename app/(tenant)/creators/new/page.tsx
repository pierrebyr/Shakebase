import Link from 'next/link'
import { Icon } from '@/components/icons'
import { CreatorForm } from './CreatorForm'

export default function NewCreatorPage() {
  return (
    <div className="page fade-up">
      <div className="page-head">
        <Link href="/creators" className="row gap-sm" style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
          <Icon name="chevron-l" size={13} />
          Creators
        </Link>
        <div className="page-kicker">New person</div>
        <h1 className="page-title">Add a creator.</h1>
      </div>
      <CreatorForm />
    </div>
  )
}
