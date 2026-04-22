import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { Icon } from '@/components/icons'
import { EmptyState } from '@/components/EmptyState'
import { CollectionCard, type CollectionCardData } from '@/components/cocktail/CollectionCard'

type Row = {
  id: string
  name: string
  description: string | null
  cover_from: string
  cover_to: string
  pinned: boolean
  updated_at: string
  created_by: string | null
  collection_cocktails: {
    cocktails: { id: string; orb_from: string | null; orb_to: string | null } | null
  }[]
}

export default async function CollectionsPage() {
  const workspace = await getCurrentWorkspace()
  const user = await getUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('collections')
    .select(
      'id, name, description, cover_from, cover_to, pinned, updated_at, created_by, collection_cocktails(cocktails(id, orb_from, orb_to))',
    )
    .eq('workspace_id', workspace.id)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  const rows = (data ?? []) as unknown as Row[]

  // Fetch owner names via admin (profiles are keyed on auth.users.id)
  const ownerIds = [...new Set(rows.map((r) => r.created_by).filter((id): id is string => !!id))]
  const ownerById = new Map<string, string>()
  if (ownerIds.length > 0) {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any
    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name')
      .in('id', ownerIds)
    for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
      if (p.full_name) ownerById.set(p.id, p.full_name)
    }
  }

  const cards: CollectionCardData[] = rows.map((col) => {
    const orbs = col.collection_cocktails
      .map((cc) => cc.cocktails)
      .filter((c): c is NonNullable<typeof c> => c != null)
      .map((c) => ({
        from: c.orb_from ?? '#f4efe0',
        to: c.orb_to ?? '#c9b89a',
      }))
    const canDelete = Boolean(
      user && (col.created_by === user.id || workspace.owner_user_id === user.id),
    )
    return {
      id: col.id,
      name: col.name,
      description: col.description,
      cover_from: col.cover_from,
      cover_to: col.cover_to,
      pinned: col.pinned,
      updated_at: col.updated_at,
      owner_name: col.created_by ? ownerById.get(col.created_by) ?? null : null,
      count: orbs.length,
      orbs,
      canDelete,
    }
  })

  return (
    <div className="page fade-up">
      <div
        className="page-head"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}
      >
        <div>
          <div className="page-kicker">
            {cards.length} {cards.length === 1 ? 'collection' : 'collections'}
          </div>
          <h1 className="page-title" style={{ textWrap: 'balance' }}>
            Collections.
          </h1>
          <p className="page-sub">
            Bundles of specs for menus, events, and press kits. Pinned collections stay at the top.
          </p>
        </div>
        <Link href="/collections/new" className="btn-primary">
          <Icon name="plus" size={14} />
          New collection
        </Link>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          kicker="No collections yet"
          title="Group cocktails by theme."
          description="Create a collection to assemble specs for a seasonal menu, a bartender's guest takeover, or a press kit."
          ctaLabel="Create a collection"
          ctaHref="/collections/new"
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--density-gap)',
            alignItems: 'stretch',
          }}
        >
          {cards.map((c) => (
            <CollectionCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  )
}
