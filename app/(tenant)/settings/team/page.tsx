import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { requireUser } from '@/lib/auth/session'
import { Icon } from '@/components/icons'
import { Avatar } from '@/components/cocktail/Avatar'
import { StatCard } from '@/components/StatCard'
import { emailConfigured } from '@/lib/email/send'
import {
  changeRoleAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from './actions'
import { InviteModalTrigger } from './InviteModal'
import { DangerZone } from './DangerZone'
import { RoleSelect } from './RoleSelect'
import { relTime } from '@/lib/datetime'
import { ROLES, type Role } from '@/lib/constants'

type MembershipRow = {
  id: string
  user_id: string | null
  role: Role
  invitation_email: string | null
  invitation_token: string | null
  invitation_expires_at: string | null
  joined_at: string | null
  invited_by: string | null
  created_at: string
}

type ProfileRow = { id: string; full_name: string | null; department: string | null }

// Race a Supabase query against an explicit deadline. Supabase's Node client
// can hang on upstream hiccups without ever resolving, which is what pushed
// /settings/team past Vercel's 10s serverless ceiling and returned 500s. We
// accept `any` here because PostgrestBuilder is thenable but not a plain
// Promise.
async function withTimeout<T>(
  p: PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[team] ${label} timed out after ${ms}ms`)), ms),
    ),
  ])
}

const ROLE_META: Record<
  Role | 'owner' | 'editor' | 'viewer',
  {
    label: string
    tint: number
    can: string[]
    cannot: string[]
  }
> = {
  owner: {
    label: 'Owner',
    tint: 28,
    can: [
      'Everything an Editor can',
      'Invite + promote members',
      'Manage billing',
      'Transfer ownership',
    ],
    cannot: [],
  },
  editor: {
    label: 'Editor',
    tint: 210,
    can: [
      'Create and edit cocktails',
      'Manage collections & ingredients',
      'Comment & resolve threads',
    ],
    cannot: ['Invite new members', 'Change billing'],
  },
  viewer: {
    label: 'Viewer',
    tint: 320,
    can: ['Browse the full library', 'Export PDFs & print menus', 'Comment on specs'],
    cannot: ['Create or edit specs', 'Manage ingredients or collections'],
  },
}

function rolePillStyle(role: Role): React.CSSProperties {
  const t = ROLE_META[role]?.tint ?? 200
  return {
    background: `oklch(0.95 0.04 ${t})`,
    color: `oklch(0.38 0.12 ${t})`,
    border: '1px solid transparent',
    textTransform: 'capitalize',
  }
}

function ActiveDot({ when }: { when: string }) {
  const live = /^(today|just now|a few)/.test(when)
  const today = /h ago|yesterday/.test(when)
  const color = live ? '#37a86a' : today ? '#d8a63a' : '#b8b2a9'
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: 99,
        background: color,
        boxShadow: live ? '0 0 0 3px rgba(55,168,106,0.18)' : 'none',
        flexShrink: 0,
      }}
    />
  )
}

export default async function TeamSettingsPage() {
  try {
    return await renderTeamPage()
  } catch (err) {
    // Next.js uses digest prefixes as control-flow throws (redirect,
    // notFound). Let them bubble untouched — they're not real errors.
    const digest =
      err && typeof err === 'object' && 'digest' in err
        ? String((err as { digest?: unknown }).digest ?? '')
        : ''
    if (
      digest.startsWith('NEXT_REDIRECT') ||
      digest.startsWith('NEXT_NOT_FOUND') ||
      digest.startsWith('NEXT_HTTP_ERROR_FALLBACK')
    ) {
      throw err
    }
    console.error('[team] render failed', {
      name: err instanceof Error ? err.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      digest,
    })
    throw err
  }
}

async function renderTeamPage() {
  const workspace = await getCurrentWorkspace()
  const user = await requireUser()

  const admin = createAdminClient()

  // Owner-gate
  const { data: me } = await withTimeout(
    admin
      .from('memberships')
      .select('role')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .not('joined_at', 'is', null)
      .maybeSingle(),
    3000,
    'owner-gate',
  )
  if (!me || (me as { role: string }).role !== 'owner') {
    redirect('/settings')
  }

  const { data: memsData } = await withTimeout(
    admin
      .from('memberships')
      .select(
        'id, user_id, role, invitation_email, invitation_token, invitation_expires_at, joined_at, invited_by, created_at',
      )
      .eq('workspace_id', workspace.id)
      .order('joined_at', { ascending: false, nullsFirst: false }),
    4000,
    'memberships',
  )
  const memberships = (memsData ?? []) as unknown as MembershipRow[]
  const active = memberships.filter((m) => m.user_id != null && m.joined_at != null)
  const pending = memberships.filter((m) => m.user_id == null && m.invitation_token)

  // Load profiles + users + edit counts + last activity
  const activeIds = active.map((m) => m.user_id!).filter(Boolean)
  const profiles = new Map<
    string,
    { full_name: string | null; department: string | null; email?: string; last_sign_in_at?: string | null; edits?: number }
  >()

  // All three of these are independent — run in parallel and race each
  // against an explicit 4s timeout so a single slow upstream can't push
  // the whole function past Vercel's 10s serverless limit.
  if (activeIds.length > 0) {
    const [profsRes, usersRes, editLogsRes] = await Promise.allSettled([
      withTimeout(
        admin.from('profiles').select('id, full_name, department').in('id', activeIds),
        4000,
        'profiles',
      ),
      withTimeout(admin.auth.admin.listUsers({ perPage: 200 }), 4000, 'listUsers'),
      withTimeout(
        admin
          .from('audit_logs')
          .select('actor_user_id')
          .eq('workspace_id', workspace.id)
          .in('actor_user_id', activeIds),
        4000,
        'edit-counts',
      ),
    ])

    if (profsRes.status === 'fulfilled') {
      const { data: profs } = profsRes.value as { data: ProfileRow[] | null }
      for (const p of (profs ?? []) as ProfileRow[]) {
        profiles.set(p.id, { full_name: p.full_name, department: p.department })
      }
    } else {
      console.error('[team] profiles fetch failed', profsRes.reason)
    }

    if (usersRes.status === 'fulfilled') {
      const usersList = (usersRes.value as { data: { users: { id: string; email?: string; last_sign_in_at?: string | null }[] } | null }).data
      for (const u of usersList?.users ?? []) {
        if (activeIds.includes(u.id)) {
          const ex = profiles.get(u.id) ?? { full_name: null, department: null }
          profiles.set(u.id, {
            ...ex,
            email: u.email,
            last_sign_in_at: u.last_sign_in_at ?? null,
          })
        }
      }
    } else {
      console.error('[team] listUsers failed', usersRes.reason)
    }

    if (editLogsRes.status === 'fulfilled') {
      const { data: logs } = editLogsRes.value as { data: { actor_user_id: string }[] | null }
      const counts = new Map<string, number>()
      for (const l of (logs ?? []) as { actor_user_id: string }[]) {
        counts.set(l.actor_user_id, (counts.get(l.actor_user_id) ?? 0) + 1)
      }
      for (const [uid, n] of counts) {
        const ex = profiles.get(uid)
        if (ex) profiles.set(uid, { ...ex, edits: n })
      }
    } else {
      console.error('[team] edit counts failed', editLogsRes.reason)
    }
  }

  // Inviter names for pending
  const inviterIds = Array.from(new Set(pending.map((p) => p.invited_by).filter(Boolean) as string[]))
  const inviterNames = new Map<string, string>()
  if (inviterIds.length > 0) {
    try {
      const { data: profs } = await withTimeout(
        admin.from('profiles').select('id, full_name').in('id', inviterIds),
        3000,
        'inviter-names',
      )
      for (const p of (profs ?? []) as ProfileRow[]) {
        inviterNames.set(p.id, p.full_name ?? 'Someone')
      }
    } catch (err) {
      console.error('[team] inviter names failed', err)
    }
  }

  const counts = {
    total: active.length,
    owners: active.filter((m) => m.role === 'owner').length,
    editors: active.filter((m) => m.role === 'editor').length,
    viewers: active.filter((m) => m.role === 'viewer').length,
  }
  const seats = 25

  // Access log — non-critical, degrade to empty list on failure.
  type LogRow = {
    id: string
    action: string
    actor_user_id: string | null
    target_type: string | null
    target_id: string | null
    metadata: unknown
    created_at: string
  }
  let logs: LogRow[] = []
  try {
    const { data: logData } = await withTimeout(
      admin
        .from('audit_logs')
        .select('id, action, actor_user_id, target_type, target_id, metadata, created_at')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(6),
      3000,
      'audit-log',
    )
    logs = (logData ?? []) as LogRow[]
  } catch (err) {
    console.error('[team] audit_logs fetch failed', err)
  }

  const actorNames = new Map<string, string>()
  const actorIds = Array.from(new Set(logs.map((l) => l.actor_user_id).filter(Boolean) as string[]))
  if (actorIds.length > 0) {
    try {
      const { data: profs } = await withTimeout(
        admin.from('profiles').select('id, full_name').in('id', actorIds),
        3000,
        'actor-profiles',
      )
      for (const p of (profs ?? []) as ProfileRow[]) {
        actorNames.set(p.id, p.full_name ?? 'Someone')
      }
    } catch (err) {
      console.error('[team] actor profiles fetch failed', err)
    }
  }

  function logKind(action: string): string {
    if (action.startsWith('member.invite')) return 'invite'
    if (action.includes('role_change')) return 'role'
    if (action.includes('remove')) return 'role'
    if (action.includes('cocktail')) return 'edit'
    if (action.includes('collection')) return 'edit'
    if (action.includes('billing') || action.includes('subscription')) return 'billing'
    if (action.includes('ownership')) return 'role'
    return 'event'
  }
  function logText(l: (typeof logs)[number]): { what: string; target: string } {
    const meta = (l.metadata ?? {}) as Record<string, unknown>
    if (l.action === 'member.invite')
      return { what: 'invited', target: String(meta.email ?? '—') }
    if (l.action === 'member.role_change')
      return { what: 'promoted', target: `to ${String(meta.role ?? '—')}` }
    if (l.action === 'member.remove') return { what: 'removed a member', target: '' }
    if (l.action === 'cocktail.create')
      return { what: 'created cocktail', target: String(meta.name ?? '—') }
    if (l.action === 'cocktail.update')
      return { what: 'edited cocktail', target: String(meta.name ?? '—') }
    if (l.action === 'workspace.ownership_transfer')
      return { what: 'transferred ownership', target: '' }
    return { what: l.action, target: '' }
  }

  const transferableMembers = active
    .filter((m) => m.user_id !== user.id)
    .map((m) => {
      const p = profiles.get(m.user_id!)
      return { id: m.id, name: p?.full_name ?? p?.email ?? 'Member' }
    })

  // Best-effort "last active" per member
  function lastActive(userId: string | null): string {
    if (!userId) return '—'
    const p = profiles.get(userId)
    return relTime(p?.last_sign_in_at ?? null)
  }

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">
          {workspace.name} · shakebase.co/{workspace.slug}
        </div>
        <h1 className="page-title" style={{ textWrap: 'balance' }}>
          Team &amp; roles.
        </h1>
        <p className="page-sub" style={{ maxWidth: '64ch' }}>
          Manage who has access to {workspace.name} and what they can edit. Owners can invite and
          promote; editors can add and modify; viewers are read-only.
        </p>
      </div>

      {/* Workspace identity card */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          marginBottom: 'var(--density-gap)',
          background: 'linear-gradient(135deg, oklch(0.94 0.05 28), oklch(0.98 0.015 50))',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 32,
            padding: '26px 32px',
            alignItems: 'center',
          }}
        >
          <div className="row" style={{ gap: 14, minWidth: 0 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #3a2b1f, #1a1311)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                boxShadow: '0 10px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
                color: '#e4b57c',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 28,
              }}
            >
              {workspace.slug.slice(0, 2)}
            </div>
            <div className="col" style={{ minWidth: 0 }}>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-4)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Workspace
              </span>
              <h2
                style={{
                  margin: '2px 0 4px',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 28,
                  letterSpacing: '-0.02em',
                }}
              >
                {workspace.name}
              </h2>
              <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
                <span className="pill" style={{ textTransform: 'capitalize' }}>
                  {workspace.subscription_status.replace('_', ' ')}
                </span>
                <span className="pill">
                  {counts.total} / {seats} seats
                </span>
                {workspace.location && (
                  <span className="pill">
                    <Icon name="pin" size={10} /> {workspace.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="row gap-sm" style={{ flexShrink: 0 }}>
            <Link href="/settings/billing" className="btn-secondary">
              <Icon name="settings" size={12} /> Workspace settings
            </Link>
            <InviteModalTrigger />
          </div>
        </div>
        <div style={{ padding: '0 32px 22px' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                color: 'var(--ink-4)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Seat usage
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {counts.total} of {seats} · {Math.max(0, seats - counts.total)} remaining
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 99,
              background: 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(counts.total / seats) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, oklch(0.58 0.14 28), oklch(0.68 0.12 50))',
                borderRadius: 99,
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 'var(--density-gap)',
          marginBottom: 'var(--density-gap)',
        }}
      >
        <StatCard
          kicker="Members"
          value={counts.total}
          sub={`${counts.total === 1 ? 'Just you' : `Across ${counts.total} people`}`}
          accent
        />
        <StatCard kicker="Owners" value={counts.owners} sub="Full access" />
        <StatCard kicker="Editors" value={counts.editors} sub="Can create & modify" />
        <StatCard
          kicker="Pending invites"
          value={pending.length}
          sub={pending.length > 0 ? 'Awaiting acceptance' : 'All caught up'}
        />
      </div>

      {/* Role explainer */}
      <div className="card card-pad" style={{ marginBottom: 'var(--density-gap)' }}>
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 20,
          }}
        >
          <div className="col">
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                color: 'var(--ink-4)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Permission model
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 26,
              }}
            >
              Three tiers, no surprises.
            </h2>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 16,
          }}
          className="role-explainer"
        >
          {(['owner', 'editor', 'viewer'] as const).map((r) => {
            const meta = ROLE_META[r]
            const n = active.filter((m) => m.role === r).length
            return (
              <div
                key={r}
                style={{
                  padding: 18,
                  borderRadius: 14,
                  border: '1px solid var(--line-2)',
                  background: `linear-gradient(180deg, oklch(0.98 0.02 ${meta.tint}) 0%, #fff 50%)`,
                }}
              >
                <div
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <span
                    className="pill"
                    style={{ ...rolePillStyle(r), fontSize: 11, padding: '4px 12px' }}
                  >
                    {meta.label}
                  </span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
                    {n} {n === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div className="col" style={{ gap: 8 }}>
                  {meta.can.map((c) => (
                    <div
                      key={c}
                      className="row gap-sm"
                      style={{ alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.4 }}
                    >
                      <Icon
                        name="check"
                        size={12}
                        style={{ color: '#37a86a', marginTop: 2, flexShrink: 0 }}
                      />
                      <span style={{ color: 'var(--ink-2)' }}>{c}</span>
                    </div>
                  ))}
                  {meta.cannot.map((c) => (
                    <div
                      key={c}
                      className="row gap-sm"
                      style={{ alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.4 }}
                    >
                      <Icon
                        name="x"
                        size={12}
                        style={{ color: 'var(--ink-4)', marginTop: 2, flexShrink: 0, opacity: 0.6 }}
                      />
                      <span
                        style={{
                          color: 'var(--ink-4)',
                          textDecoration: 'line-through',
                          textDecorationColor: 'var(--line-1)',
                        }}
                      >
                        {c}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Members table */}
      <div
        className="card"
        style={{ padding: 0, marginBottom: 'var(--density-gap)', overflow: 'visible' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-2)' }}>
          <div
            className="row"
            style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
          >
            <div className="col">
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 22,
                }}
              >
                Members
              </h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                {active.length} active
              </span>
            </div>
            <InviteModalTrigger>Invite teammate</InviteModalTrigger>
          </div>
        </div>

        <div>
          {active.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
              No active members yet. Invite someone above.
            </div>
          ) : (
            active.map((m, i) => {
              const p = profiles.get(m.user_id!) ?? {
                full_name: null,
                department: null,
                email: undefined,
                edits: 0,
              }
              const name = p.full_name ?? p.email ?? 'Member'
              const isYou = m.user_id === user.id
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 120px 1fr 70px 48px',
                    gap: 14,
                    padding: '14px 22px',
                    alignItems: 'center',
                    borderTop: i === 0 ? 'none' : '1px solid var(--line-2)',
                    minHeight: 56,
                  }}
                >
                  {/* Member */}
                  <div className="row gap-sm" style={{ minWidth: 0 }}>
                    <Avatar name={name} size={36} />
                    <div className="col" style={{ minWidth: 0 }}>
                      <div className="row gap-sm" style={{ alignItems: 'center', minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {name}
                        </span>
                        {isYou && (
                          <span
                            className="pill"
                            style={{
                              fontSize: 10,
                              background: 'var(--accent-wash)',
                              color: 'var(--accent-ink)',
                              borderColor: 'transparent',
                            }}
                          >
                            You
                          </span>
                        )}
                      </div>
                      <span
                        className="mono"
                        style={{
                          fontSize: 10.5,
                          color: 'var(--ink-4)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.email ?? '—'}
                      </span>
                    </div>
                  </div>

                  {/* Department */}
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--ink-2)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.department ?? <em style={{ color: 'var(--ink-4)' }}>—</em>}
                  </div>

                  {/* Role */}
                  <div>
                    {isYou || m.role === 'owner' ? (
                      <span
                        className="pill"
                        style={{ ...rolePillStyle(m.role), fontSize: 11 }}
                      >
                        {ROLE_META[m.role].label}
                      </span>
                    ) : (
                      <form action={changeRoleAction}>
                        <RoleSelect
                          membershipId={m.id}
                          role={m.role}
                          options={ROLES.filter((r) => r !== 'owner').map((r) => ({
                            value: r,
                            label: ROLE_META[r].label,
                          }))}
                          style={{
                            ...rolePillStyle(m.role),
                            fontFamily: 'var(--font-ui)',
                            fontSize: 11,
                            padding: '4px 22px 4px 12px',
                            borderRadius: 999,
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                          }}
                        />
                      </form>
                    )}
                  </div>

                  {/* Last active */}
                  <div
                    className="row gap-sm"
                    style={{
                      justifyContent: 'flex-end',
                      fontSize: 12,
                      color: 'var(--ink-3)',
                    }}
                  >
                    <ActiveDot when={lastActive(m.user_id)} />
                    <span style={{ whiteSpace: 'nowrap' }}>{lastActive(m.user_id)}</span>
                  </div>

                  {/* Edits */}
                  <div
                    className="mono"
                    style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-3)' }}
                  >
                    {p.edits ?? 0}
                  </div>

                  {/* Actions */}
                  <div style={{ textAlign: 'right' }}>
                    {isYou || m.role === 'owner' ? (
                      <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>—</span>
                    ) : (
                      <form action={removeMemberAction}>
                        <input type="hidden" name="membership_id" value={m.id} />
                        <button
                          type="submit"
                          className="icon-btn"
                          style={{ width: 30, height: 30, color: 'var(--crit)' }}
                          title="Remove from workspace"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Pending invites */}
      {pending.length > 0 && (
        <div
          className="card"
          style={{ padding: 0, marginBottom: 'var(--density-gap)' }}
        >
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-2)' }}>
            <div
              className="row"
              style={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div className="col">
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: 22,
                  }}
                >
                  Pending invites
                </h2>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                  {pending.length} awaiting acceptance
                  {!emailConfigured() ? ' · Resend not configured, send links manually' : ''}
                </span>
              </div>
              <InviteModalTrigger>Invite more</InviteModalTrigger>
            </div>
          </div>
          <div>
            {pending.map((inv, i) => {
              const by = inv.invited_by ? inviterNames.get(inv.invited_by) : null
              return (
                <div
                  key={inv.id}
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 22px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--line-2)',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    className="row gap-sm"
                    style={{ minWidth: 0, flex: '1 1 240px' }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 999,
                        background: 'var(--bg-sunken)',
                        border: '1px dashed var(--line-1)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        color: 'var(--ink-4)',
                      }}
                    >
                      <Icon name="bell" size={14} />
                    </div>
                    <div className="col" style={{ minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {inv.invitation_email}
                      </span>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
                        {by ? `Invited by ${by}` : 'Pending'} ·{' '}
                        {inv.invitation_expires_at
                          ? `expires ${new Date(inv.invitation_expires_at).toLocaleDateString()}`
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <span
                    className="pill"
                    style={{ ...rolePillStyle(inv.role), fontSize: 11 }}
                  >
                    {ROLE_META[inv.role].label}
                  </span>
                  <div className="row gap-sm">
                    <form action={resendInviteAction}>
                      <input type="hidden" name="membership_id" value={inv.id} />
                      <button
                        type="submit"
                        className="btn-secondary"
                        style={{ padding: '6px 12px' }}
                      >
                        Resend
                      </button>
                    </form>
                    <form action={revokeInviteAction}>
                      <input type="hidden" name="membership_id" value={inv.id} />
                      <button
                        type="submit"
                        className="btn-secondary"
                        style={{ padding: '6px 12px', color: 'var(--crit)' }}
                      >
                        Revoke
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom 2-col */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
          gap: 'var(--density-gap)',
        }}
        className="ws-bottom"
      >
        <div className="card card-pad">
          <div
            className="row"
            style={{
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: 16,
            }}
          >
            <div className="col">
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-4)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Access log
              </span>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 22,
                }}
              >
                Recent activity.
              </h2>
            </div>
          </div>
          <div className="col" style={{ gap: 0 }}>
            {logs.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink-4)', margin: 0 }}>
                No activity yet. Invites, role changes, and cocktail edits will appear here.
              </p>
            ) : (
              logs.map((l, i) => {
                const whoName =
                  (l.actor_user_id && actorNames.get(l.actor_user_id)) ??
                  (l.actor_user_id === user.id ? 'You' : 'Someone')
                const { what, target } = logText(l)
                return (
                  <div
                    key={l.id}
                    className="row"
                    style={{
                      alignItems: 'center',
                      padding: '11px 0',
                      borderTop: i === 0 ? 'none' : '1px solid var(--line-2)',
                      gap: 12,
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 9.5,
                        color: 'var(--ink-4)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        width: 62,
                        flexShrink: 0,
                      }}
                    >
                      {logKind(l.action)}
                    </span>
                    <span
                      style={{
                        fontSize: 12.5,
                        color: 'var(--ink-2)',
                        flex: 1,
                        minWidth: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <strong style={{ fontWeight: 500, color: 'var(--ink-1)' }}>{whoName}</strong>{' '}
                      <span style={{ color: 'var(--ink-3)' }}>{what}</span>{' '}
                      {target && (
                        <span
                          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
                        >
                          {target}
                        </span>
                      )}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        color: 'var(--ink-4)',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {relTime(l.created_at)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="col" style={{ gap: 'var(--density-gap)' }}>
          <div className="card card-pad">
            <div className="panel-title" style={{ marginBottom: 10 }}>
              Identity provider
            </div>
            <div className="row" style={{ gap: 14, alignItems: 'center' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--bg-sunken)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--ink-2)',
                }}
              >
                <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
                  G
                </span>
              </div>
              <div className="col" style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: 'var(--ink-1)' }}>
                  Google Workspace SSO
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
                  Coming soon · enforce domain-wide access
                </span>
              </div>
              <span
                className="pill"
                style={{
                  fontSize: 10.5,
                  background: 'var(--bg-sunken)',
                  color: 'var(--ink-4)',
                }}
              >
                Inactive
              </span>
            </div>
          </div>

          <DangerZone workspaceName={workspace.name} members={transferableMembers} />
        </div>
      </div>
    </>
  )
}
