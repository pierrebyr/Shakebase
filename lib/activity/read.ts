import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { ACTIVITY_KINDS } from './kinds'

type EventRow = {
  id: string
  workspace_id: string
  user_id: string | null
  occurred_at: string
  kind: string
  target_type: string | null
  target_id: string | null
  target_label: string | null
  metadata: Record<string, unknown> | null
  is_admin_impersonation: boolean
}

// Read helpers for the owner activity dashboard. Each helper aggregates
// over `activity_events` for one workspace and one time window. They
// filter out `is_admin_impersonation = true` from aggregates — super
// admins browsing impersonated workspaces shouldn't pollute stats.

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString()
}

export type TopCocktailRow = {
  id: string
  label: string
  views: number
}

export async function getTopCocktailsByViews(
  workspaceId: string,
  days: number,
  limit = 10,
): Promise<TopCocktailRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_events')
    .select('target_id, target_label')
    .eq('workspace_id', workspaceId)
    .eq('kind', ACTIVITY_KINDS.COCKTAIL_VIEW)
    .eq('is_admin_impersonation', false)
    .gte('occurred_at', isoDaysAgo(days))
    .limit(5000)
  const rows = (data ?? []) as { target_id: string | null; target_label: string | null }[]
  const counts = new Map<string, { label: string; views: number }>()
  for (const r of rows) {
    if (!r.target_id) continue
    const hit = counts.get(r.target_id)
    if (hit) hit.views += 1
    else counts.set(r.target_id, { label: r.target_label ?? '—', views: 1 })
  }
  return [...counts.entries()]
    .map(([id, v]) => ({ id, label: v.label, views: v.views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
}

export type TopSearchRow = {
  q: string
  count: number
  zeroResultCount: number
}

export async function getTopSearches(
  workspaceId: string,
  days: number,
  limit = 10,
): Promise<TopSearchRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_events')
    .select('metadata')
    .eq('workspace_id', workspaceId)
    .eq('kind', ACTIVITY_KINDS.SEARCH_QUERY)
    .eq('is_admin_impersonation', false)
    .gte('occurred_at', isoDaysAgo(days))
    .limit(5000)
  const rows = (data ?? []) as { metadata: Record<string, unknown> | null }[]
  const counts = new Map<string, { count: number; zeroResultCount: number }>()
  for (const r of rows) {
    const q = String(r.metadata?.q ?? '').trim().toLowerCase()
    if (q.length < 2) continue
    const resultCount = Number(r.metadata?.result_count ?? 0)
    const hit = counts.get(q)
    if (hit) {
      hit.count += 1
      if (resultCount === 0) hit.zeroResultCount += 1
    } else {
      counts.set(q, { count: 1, zeroResultCount: resultCount === 0 ? 1 : 0 })
    }
  }
  return [...counts.entries()]
    .map(([q, v]) => ({ q, count: v.count, zeroResultCount: v.zeroResultCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export type ActiveMemberRow = {
  userId: string
  events: number
}

export async function getActiveMembers(
  workspaceId: string,
  days: number,
  limit = 10,
): Promise<ActiveMemberRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_events')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('is_admin_impersonation', false)
    .gte('occurred_at', isoDaysAgo(days))
    .limit(20_000)
  const rows = (data ?? []) as { user_id: string | null }[]
  const counts = new Map<string, number>()
  for (const r of rows) {
    if (!r.user_id) continue
    counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([userId, events]) => ({ userId, events }))
    .sort((a, b) => b.events - a.events)
    .slice(0, limit)
}

export async function getRecentActivity(
  workspaceId: string,
  limit = 50,
): Promise<EventRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_events')
    .select(
      'id, workspace_id, user_id, occurred_at, kind, target_type, target_id, target_label, metadata, is_admin_impersonation',
    )
    .eq('workspace_id', workspaceId)
    .order('occurred_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as EventRow[]
}

export type ActivitySummary = {
  totalEvents: number
  activeMembers: number
  topCocktails: TopCocktailRow[]
  topSearches: TopSearchRow[]
  members: ActiveMemberRow[]
  timeline: EventRow[]
}

export async function getActivitySummary(
  workspaceId: string,
  days: number,
): Promise<ActivitySummary> {
  const [topCocktails, topSearches, members, timeline] = await Promise.all([
    getTopCocktailsByViews(workspaceId, days),
    getTopSearches(workspaceId, days),
    getActiveMembers(workspaceId, days),
    getRecentActivity(workspaceId, 50),
  ])
  const totalEvents = members.reduce((acc, m) => acc + m.events, 0)
  return {
    totalEvents,
    activeMembers: members.length,
    topCocktails,
    topSearches,
    members,
    timeline,
  }
}
