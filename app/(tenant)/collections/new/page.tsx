import Link from 'next/link'
import { Icon } from '@/components/icons'
import { NewCollectionForm } from './NewCollectionForm'

export default function NewCollectionPage() {
  return (
    <div className="page fade-up">
      <div className="page-head">
        <Link
          href="/collections"
          className="btn-ghost"
          style={{ marginBottom: 12, padding: 0 }}
        >
          <Icon name="chevron-l" size={12} />
          Collections
        </Link>
        <div className="page-kicker">New collection</div>
        <h1 className="page-title">Name it and assemble specs.</h1>
        <p className="page-sub">
          Give the collection a name, a short note, and pick a cover. You can add cocktails from
          the detail page once it&apos;s created.
        </p>
      </div>
      <NewCollectionForm />
    </div>
  )
}
