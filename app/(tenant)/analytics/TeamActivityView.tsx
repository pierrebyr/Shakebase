import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { SectionHead } from '@/components/SectionHead'
import { StatCard } from '@/components/StatCard'
import { BarRow } from '@/components/BarRow'
import { Avatar } from '@/components/cocktail/Avatar'
import { getActivitySummary } from '@/lib/activity/read'
import { ACTIVITY_KINDS, type ActivityKind } from '@/lib/activity/kinds'

type Props = {
  workspaceId: string
  workspaceName: string
  days: number
}

const KIND_LABEL: Record<ActivityKind, string> = {
  [ACTIVITY_KINDS.COCKTAIL_VIEW]: 'viewed cocktail',
  [ACTIVITY_KINDS.PRODUCT_VIEW]: 'viewed product',
  [ACTIVITY_KINDS.CREATOR_VIEW]: 'viewed creator',
  [ACTIVITY_KINDS.PAGE_VIEW]: 'visited',
  [ACTIVITY_KINDS.SEARCH_QUERY]: 'searched',
  [ACTIVITY_KINDS.COCKTAIL_FAVORITE]: 'favorited',
  [ACTIVITY_KINDS.COCKTAIL_UNFAVORITE]: 'unfavorited',
  [ACTIVITY_KINDS.COCKTAIL_CREATE]: 'created cocktail',
  [ACTIVITY_KINDS.COCKTAIL_EDIT]: 'edited cocktail',
  [ACTIVITY_KINDS.COCKTAIL_DELETE]: 'deleted cocktail',
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export async function TeamActivityView({ workspaceId, workspaceName, days }: Props) {
  const summary = await getActivitySummary(workspaceId, days)

  const activeUserIds = Array.from(
    new Set(
      summary.timeline
        .map((e) => e.user_id)
        .filter((u): u is string => typeof u === 'string'),
    ),
  )
  const memberUserIds = Array.from(
    new Set([...summary.members.map((m) => m.userId), ...activeUserIds]),
  )

  const admin = createAdminClient()
  const profiles = new Map<string, { name: string; avatar: string | null }>()
  if (memberUserIds.length > 0) {
    const { data } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', memberUserIds)
    for (const p of (data ?? []) as { id: string; full_name: string | null; avatar_url: string | null }[]) {
      profiles.set(p.id, {
        name: p.full_name ?? 'Unknown',
        avatar: p.avatar_url ?? null,
      })
    }
  }

  const topTopCocktailViews = summary.topCocktails[0]?.views ?? 0
  const topSearchCount = summary.topSearches[0]?.count ?? 0
  const zeroResultSearches = summary.topSearches.filter((s) => s.zeroResultCount > 0).length

  return (
    <div>
      <div className="page-head">
        <div className="page-kicker">Team activity · {workspaceName}</div>
        <h1 className="page-title">Who&rsquo;s using the library.</h1>
        <p className="page-sub">
          {summary.totalEvents} event{summary.totalEvents === 1 ? '' : 's'} from{' '}
          {summary.activeMembers} member{summary.activeMembers === 1 ? '' : 's'} in the last {days}{' '}
          day{days === 1 ? '' : 's'}. Super-admin impersonation visits are tagged in the timeline
          but excluded from aggregate counts.
        </p>
        <div
          className="seg-toggle"
          style={{
            display: 'inline-flex',
            gap: 6,
            marginTop: 14,
            padding: 4,
            borderRadius: 999,
            background: 'var(--bg-sunken)',
            border: '1px solid var(--line-2)',
          }}
        >
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/analytics?tab=team&days=${d}`}
              scroll={false}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                background: d === days ? '#fff' : 'transparent',
                color: d === days ? 'var(--ink-1)' : 'var(--ink-4)',
                boxShadow: d === days ? 'var(--shadow-1)' : 'none',
              }}
            >
              Last {d}d
            </Link>
          ))}
        </div>
      </div>

      {/* Hero stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--density-gap)',
          marginTop: 24,
        }}
      >
        <StatCard
          kicker="Total events"
          value={summary.totalEvents}
          sub={`last ${days} day${days === 1 ? '' : 's'}`}
        />
        <StatCard
          kicker="Active members"
          value={summary.activeMembers}
          sub={`of your team`}
        />
        <StatCard
          kicker="Top cocktail views"
          value={topTopCocktailViews}
          sub={summary.topCocktails[0]?.label ?? '—'}
          accent
        />
        <StatCard
          kicker="Unique searches"
          value={summary.topSearches.length}
          sub={
            zeroResultSearches > 0
              ? `${zeroResultSearches} returned zero results`
              : topSearchCount > 0
              ? `"${summary.topSearches[0]?.q}" is the top query`
              : '—'
          }
        />
      </div>

      {/* Top cocktails + top searches */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          marginTop: 36,
        }}
      >
        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead kicker="Cocktails" title="Most viewed" />
          {summary.topCocktails.length === 0 ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '12px 0' }}>
              No cocktail views in the last {days} day{days === 1 ? '' : 's'}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {summary.topCocktails.map((c) => (
                <BarRow
                  key={c.id}
                  label={c.label}
                  sub={`${c.views} view${c.views === 1 ? '' : 's'}`}
                  value={c.views}
                  max={topTopCocktailViews}
                />
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad" style={{ padding: 22 }}>
          <SectionHead kicker="Searches" title="Top queries" />
          {summary.topSearches.length === 0 ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '12px 0' }}>
              No searches logged in the last {days} day{days === 1 ? '' : 's'}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {summary.topSearches.map((s) => {
                const sub =
                  s.zeroResultCount > 0
                    ? `${s.count} search${s.count === 1 ? '' : 'es'} · ${s.zeroResultCount} zero-result`
                    : `${s.count} search${s.count === 1 ? '' : 'es'}`
                return (
                  <BarRow
                    key={s.q}
                    label={`"${s.q}"`}
                    sub={sub}
                    value={s.count}
                    max={topSearchCount}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active members */}
      <div className="card card-pad" style={{ padding: 22, marginTop: 20 }}>
        <SectionHead kicker="People" title="Active team members" />
        {summary.members.length === 0 ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '12px 0' }}>
            No tracked activity from team members yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              marginTop: 12,
            }}
          >
            {summary.members.map((m) => {
              const prof = profiles.get(m.userId)
              return (
                <div
                  key={m.userId}
                  className="row"
                  style={{
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    border: '1px solid var(--line-2)',
                    background: 'var(--bg-sunken)',
                  }}
                >
                  <Avatar name={prof?.name ?? '—'} size={36} />
                  <div className="col" style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{prof?.name ?? 'Unknown'}</span>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.06em' }}
                    >
                      {m.events} event{m.events === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card card-pad" style={{ padding: 22, marginTop: 20 }}>
        <SectionHead kicker="Recent" title="Activity timeline" />
        {summary.timeline.length === 0 ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '12px 0' }}>
            Nothing yet — events will show up here as your team browses.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {summary.timeline.map((ev, i) => {
              const prof = ev.user_id ? profiles.get(ev.user_id) : null
              const who = prof?.name ?? (ev.user_id ? 'Unknown' : 'Removed user')
              const verb = KIND_LABEL[ev.kind as ActivityKind] ?? ev.kind
              const what = ev.target_label ?? (ev.kind === 'search.query' ? `"${String(ev.metadata?.q ?? '')}"` : '')
              return (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 4px',
                    borderBottom:
                      i < summary.timeline.length - 1 ? '1px solid var(--line-2)' : 'none',
                  }}
                >
                  <Avatar name={who} size={30} />
                  <div className="col" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <strong style={{ fontWeight: 500 }}>{who}</strong>
                      <span style={{ color: 'var(--ink-3)' }}>{verb}</span>
                      {what && <span style={{ fontWeight: 500 }}>{what}</span>}
                      {ev.is_admin_impersonation && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: 'var(--accent-wash)',
                            color: 'var(--accent-ink)',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Admin
                        </span>
                      )}
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.06em' }}
                    >
                      {relTime(ev.occurred_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
