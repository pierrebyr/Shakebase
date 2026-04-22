import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { Icon } from '@/components/icons'
import { CreatorsFilterBar } from './CreatorsFilterBar'
import type { CreatorCardData } from './CreatorCard'
import type { CreatorRow } from '@/lib/creator/types'

type CocktailMini = {
  id: string
  creator_id: string | null
  orb_from: string | null
  orb_to: string | null
}

export default async function CreatorsPage() {
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const [{ data: creatorsData }, { data: cocktailsData }] = await Promise.all([
    supabase
      .from('creators')
      .select(
        'id, name, role, venue, city, country, joined_year, bio, photo_url, pronouns, signature, philosophy, avatar_hue, specialties, languages, mentors, awards, competitions, certifications, career, press, book, socials',
      )
      .eq('workspace_id', workspace.id)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('cocktails')
      .select('id, creator_id, orb_from, orb_to')
      .eq('workspace_id', workspace.id)
      .neq('status', 'archived'),
  ])

  const creators = (creatorsData ?? []) as unknown as CreatorRow[]
  const cocktails = (cocktailsData ?? []) as unknown as CocktailMini[]

  const byCreator = new Map<string, CocktailMini[]>()
  for (const c of cocktails) {
    if (!c.creator_id) continue
    const list = byCreator.get(c.creator_id) ?? []
    list.push(c)
    byCreator.set(c.creator_id, list)
  }

  const cards: CreatorCardData[] = creators
    .map((cr) => ({
      ...cr,
      drinks: byCreator.get(cr.id) ?? [],
    }))
    // Default sort: most cocktails first, then alphabetical as tie-breaker
    .sort((a, b) => {
      const diff = b.drinks.length - a.drinks.length
      if (diff !== 0) return diff
      return a.name.localeCompare(b.name)
    })

  const countries = new Set(creators.map((c) => c.country).filter(Boolean) as string[])
  const totalAwards = creators.reduce((s, c) => s + (c.awards?.length ?? 0), 0)

  return (
    <div className="page fade-up">
      <div
        className="page-head"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}
      >
        <div>
          <div className="page-kicker">
            {creators.length} contributor{creators.length === 1 ? '' : 's'}
            {countries.size > 0
              ? ` · ${countries.size} ${countries.size === 1 ? 'country' : 'countries'}`
              : ''}
            {totalAwards > 0 ? ` · ${totalAwards} award${totalAwards === 1 ? '' : 's'}` : ''}
          </div>
          <h1 className="page-title" style={{ textWrap: 'balance' }}>
            The people behind the pour.
          </h1>
          <p className="page-sub">
            Bartenders, R&amp;D leads, and guest creators whose work lives in {workspace.name}.
          </p>
        </div>
        <Link href="/creators/new" className="btn-primary">
          <Icon name="plus" size={14} />
          Add creator
        </Link>
      </div>

      <CreatorsFilterBar creators={cards} />
    </div>
  )
}
