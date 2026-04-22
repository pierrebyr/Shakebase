import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { Icon } from '@/components/icons'
import { EditCreatorForm } from './EditCreatorForm'
import { CreatorPhotoUploader } from './CreatorPhotoUploader'
import { deleteCreatorAction } from './actions'
import type { CreatorRow } from '@/lib/creator/types'

type Props = { params: Promise<{ id: string }> }

export default async function EditCreatorPage({ params }: Props) {
  const { id } = await params
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const { data } = await supabase
    .from('creators')
    .select(
      'id, name, role, venue, city, country, joined_year, bio, photo_url, pronouns, signature, philosophy, avatar_hue, specialties, languages, mentors, awards, competitions, certifications, career, press, book, socials',
    )
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const creator = data as CreatorRow | null
  if (!creator) notFound()

  return (
    <div className="page fade-up" style={{ maxWidth: 900 }}>
      <div className="page-head">
        <Link
          href={`/creators/${creator.id}`}
          className="btn-ghost"
          style={{ marginBottom: 12, padding: 0 }}
        >
          <Icon name="chevron-l" size={12} />
          Back to profile
        </Link>
        <div className="page-kicker">Editing creator</div>
        <h1 className="page-title" style={{ textWrap: 'balance' }}>
          {creator.name}
        </h1>
      </div>

      <div className="col" style={{ gap: 20 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 220px',
            gap: 20,
            alignItems: 'start',
          }}
          className="creator-edit-top"
        >
          <EditCreatorForm creator={creator} />
          <div
            className="card card-pad"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div className="panel-title">Portrait</div>
            <CreatorPhotoUploader
              creatorId={creator.id}
              creatorName={creator.name}
              currentUrl={creator.photo_url}
            />
            <p style={{ fontSize: 11, color: 'var(--ink-4)', margin: 0, lineHeight: 1.4 }}>
              Square works best. If empty, the tinted initials avatar is used.
            </p>
          </div>
        </div>

        <form
          action={deleteCreatorAction}
          className="card card-pad"
          style={{
            padding: 20,
            border: '1px solid #f0cccc',
            background: '#fdf7f7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: 820,
          }}
        >
          <input type="hidden" name="id" value={creator.id} />
          <div>
            <div className="panel-title" style={{ color: 'var(--crit)', marginBottom: 4 }}>
              Danger zone
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: 0 }}>
              Remove this creator. Cocktails they authored will become unattributed.
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
            Delete creator
          </button>
        </form>
      </div>
    </div>
  )
}
