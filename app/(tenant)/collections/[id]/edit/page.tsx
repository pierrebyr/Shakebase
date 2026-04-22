import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { Icon } from '@/components/icons'
import { EditCollectionForm } from './EditCollectionForm'
import { deleteCollectionAction } from '../actions'

type Props = { params: Promise<{ id: string }> }

type CollectionRow = {
  id: string
  name: string
  description: string | null
  cover_from: string
  cover_to: string
  pinned: boolean
  created_by: string | null
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params
  const workspace = await getCurrentWorkspace()
  const user = await getUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('collections')
    .select('id, name, description, cover_from, cover_to, pinned, created_by')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const collection = data as CollectionRow | null
  if (!collection) notFound()

  // Only the creator (or workspace owner) can reach the editor. Non-creators
  // are redirected to the view page.
  const canEdit =
    Boolean(user) &&
    (collection.created_by === user!.id || workspace.owner_user_id === user!.id)
  if (!canEdit) redirect(`/collections/${collection.id}`)

  return (
    <div className="page fade-up" style={{ maxWidth: 640 }}>
      <div className="page-head">
        <Link
          href={`/collections/${collection.id}`}
          className="btn-ghost"
          style={{ marginBottom: 12, padding: 0 }}
        >
          <Icon name="chevron-l" size={12} />
          Back to collection
        </Link>
        <div className="page-kicker">Editing collection</div>
        <h1 className="page-title" style={{ textWrap: 'balance' }}>
          {collection.name}
        </h1>
      </div>

      <div className="col" style={{ gap: 20 }}>
        <EditCollectionForm collection={collection} />

        <form
          action={deleteCollectionAction}
          className="card card-pad"
          style={{
            padding: 20,
            border: '1px solid #f0cccc',
            background: '#fdf7f7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <input type="hidden" name="id" value={collection.id} />
          <div>
            <div className="panel-title" style={{ color: 'var(--crit)', marginBottom: 4 }}>
              Danger zone
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: 0 }}>
              Delete this collection. Cocktails remain in your library.
            </p>
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: '#fff',
              color: 'var(--crit)',
              border: '1px solid #e6b3b3',
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            Delete collection
          </button>
        </form>
      </div>
    </div>
  )
}
