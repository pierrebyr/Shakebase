'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { trackEvent } from '@/lib/activity/track'
import { ACTIVITY_KINDS } from '@/lib/activity/kinds'

export type SearchHit =
  | { kind: 'cocktail'; id: string; slug: string; title: string; subtitle: string | null; image_url: string | null; orb_from: string | null; orb_to: string | null }
  | { kind: 'creator'; id: string; title: string; subtitle: string | null; photo_url: string | null }
  | { kind: 'ingredient'; id: string; title: string; subtitle: string | null; source: 'global' | 'workspace' }

export type SearchResult = {
  cocktails: Extract<SearchHit, { kind: 'cocktail' }>[]
  creators: Extract<SearchHit, { kind: 'creator' }>[]
  ingredients: Extract<SearchHit, { kind: 'ingredient' }>[]
}

export async function topbarSearchAction(query: string): Promise<SearchResult> {
  const q = query.trim()
  if (q.length < 1) return { cocktails: [], creators: [], ingredients: [] }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const pattern = `%${q}%`

  const [
    { data: cocktailRows },
    { data: creatorRows },
    { data: globalIngRows },
    { data: wsIngRows },
  ] = await Promise.all([
    supabase
      .from('cocktails')
      .select('id, slug, name, category, image_url, orb_from, orb_to, status')
      .eq('workspace_id', workspace.id)
      .neq('status', 'archived')
      .ilike('name', pattern)
      .order('name')
      .limit(6),
    supabase
      .from('creators')
      .select('id, name, role, venue, photo_url')
      .eq('workspace_id', workspace.id)
      .ilike('name', pattern)
      .order('name')
      .limit(4),
    supabase
      .from('global_ingredients')
      .select('id, name, category')
      .ilike('name', pattern)
      .order('name')
      .limit(5),
    supabase
      .from('workspace_ingredients')
      .select('id, name, category')
      .eq('workspace_id', workspace.id)
      .ilike('name', pattern)
      .order('name')
      .limit(3),
  ])

  const cocktails = ((cocktailRows ?? []) as {
    id: string
    slug: string
    name: string
    category: string | null
    image_url: string | null
    orb_from: string | null
    orb_to: string | null
  }[]).map((r) => ({
    kind: 'cocktail' as const,
    id: r.id,
    slug: r.slug,
    title: r.name,
    subtitle: r.category,
    image_url: r.image_url,
    orb_from: r.orb_from,
    orb_to: r.orb_to,
  }))

  const creators = ((creatorRows ?? []) as {
    id: string
    name: string
    role: string | null
    venue: string | null
    photo_url: string | null
  }[]).map((r) => ({
    kind: 'creator' as const,
    id: r.id,
    title: r.name,
    subtitle: [r.role, r.venue].filter(Boolean).join(' · ') || null,
    photo_url: r.photo_url,
  }))

  const ingredients: Extract<SearchHit, { kind: 'ingredient' }>[] = [
    ...((globalIngRows ?? []) as { id: string; name: string; category: string | null }[]).map(
      (r) => ({
        kind: 'ingredient' as const,
        id: r.id,
        title: r.name,
        subtitle: r.category,
        source: 'global' as const,
      }),
    ),
    ...((wsIngRows ?? []) as { id: string; name: string; category: string | null }[]).map(
      (r) => ({
        kind: 'ingredient' as const,
        id: r.id,
        title: r.name,
        subtitle: r.category,
        source: 'workspace' as const,
      }),
    ),
  ]

  const resultCount = cocktails.length + creators.length + ingredients.length
  // Only log if the user typed something meaningful — single-char queries
  // are noise (autocomplete-style); 2+ chars is an intentional search.
  if (q.length >= 2) {
    await trackEvent({
      kind: ACTIVITY_KINDS.SEARCH_QUERY,
      metadata: {
        q,
        scope: 'global',
        result_count: resultCount,
        cocktails_count: cocktails.length,
        creators_count: creators.length,
        ingredients_count: ingredients.length,
      },
      // Dedupe per normalized query within a minute — typing "mar" →
      // "marg" → "marga" still logs each distinct query, but reloading
      // the same query 5 s later is suppressed.
      dedupeWindowSec: 60,
      dedupeDiscriminator: `global:${q.toLowerCase()}`,
    })
  }

  return { cocktails, creators, ingredients }
}
