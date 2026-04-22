import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import {
  fmtDate,
  fmtDateTime,
  statusLabel,
  statusTone,
  timeAgo,
  wsColor,
  wsGlyph,
} from '@/lib/admin/format'
import { ImpersonateForm } from './ImpersonateForm'

type WorkspaceRow = {
  id: string
  slug: string
  name: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  location: string | null
}

type Params = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ impersonate?: string; action?: string; reason?: string }>
}

export default async function WorkspaceDetailPage({ params, searchParams }: Params) {
  const { id } = await params
  const { impersonate, action, reason } = await searchParams
  const admin = createAdminClient()

  const { data: ws } = await admin
    .from('workspaces')
    .select(
      'id, slug, name, subscription_status, trial_ends_at, created_at, stripe_customer_id, stripe_subscription_id, location',
    )
    .eq('id', id)
    .maybeSingle()

  if (!ws) notFound()
  const w = ws as WorkspaceRow

  const [
    { data: members },
    { count: cocktails },
    { count: creators },
    { count: products },
    { count: ingredients },
  ] = await Promise.all([
    admin
      .from('memberships')
      .select('user_id, role, joined_at')
      .eq('workspace_id', w.id)
      .not('joined_at', 'is', null)
      .order('joined_at', { ascending: false }),
    admin
      .from('cocktails')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', w.id)
      .neq('status', 'archived'),
    admin.from('creators').select('id', { count: 'exact', head: true }).eq('workspace_id', w.id),
    admin
      .from('workspace_products')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', w.id),
    admin
      .from('workspace_ingredients')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', w.id),
  ])

  const memberRows = (members ?? []) as {
    user_id: string
    role: string
    joined_at: string | null
  }[]
  const userIds = memberRows.map((m) => m.user_id)
  const { data: userList } = await admin.auth.admin.listUsers({ perPage: 500 })
  const usersMap = new Map(
    userList.users.filter((u) => userIds.includes(u.id)).map((u) => [u.id, u]),
  )
  const owner = memberRows.find((m) => m.role === 'owner')
  const ownerUser = owner ? usersMap.get(owner.user_id) : null

  // Recent cocktails as a proxy for activity
  const { data: recentCocktails } = await admin
    .from('cocktails')
    .select('id, name, status, updated_at')
    .eq('workspace_id', w.id)
    .order('updated_at', { ascending: false })
    .limit(8)

  const recent = (recentCocktails ?? []) as {
    id: string
    name: string
    status: string
    updated_at: string | null
  }[]

  // Workspace-scoped audit events
  const { data: auditRows } = await admin
    .from('audit_events')
    .select('id, at, actor_kind, actor_email, action, target_label, meta')
    .eq('workspace_id', w.id)
    .order('at', { ascending: false })
    .limit(8)

  const auditEvents = ((auditRows ?? []) as unknown as {
    id: string
    at: string
    actor_kind: string
    actor_email: string | null
    action: string
    target_label: string | null
    meta: Record<string, unknown>
  }[])

  return (
    <div className="op-page op-fade-up" style={{ paddingTop: 0 }}>
      {/* Breadcrumb-ish header */}
      <div style={{ padding: '20px 0', marginBottom: 0 }}>
        <Link
          href="/admin/workspaces"
          className="op-btn ghost sm"
          style={{ padding: '4px 8px' }}
        >
          <OpIcon name="chevron" size={12} style={{ transform: 'rotate(180deg)' }} />
          All workspaces
        </Link>
      </div>

      {impersonate && impersonate !== 'pending' && (
        <ImpersonationError code={impersonate} />
      )}

      {action && <ActionToast action={action} reason={reason} />}

      {/* Header card */}
      <div className="op-card" style={{ marginBottom: 18 }}>
        <div
          style={{
            padding: '22px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: wsColor(w.slug),
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 26,
            }}
          >
            {wsGlyph(w.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 28,
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}
              >
                {w.name}
              </h1>
              <span className={'op-chip ' + statusTone(w.subscription_status)}>
                <span className="dot"></span>
                {statusLabel(w.subscription_status)}
              </span>
            </div>
            <div
              className="mut mono"
              style={{ fontSize: 10.5, marginTop: 6, letterSpacing: '0.08em' }}
            >
              {w.id} · {w.slug}.shakebase.co · Created {fmtDate(w.created_at)}
              {w.location ? ` · ${w.location}` : ''}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '14px 24px',
            borderTop: '1px solid var(--op-line-1)',
            flexWrap: 'wrap',
          }}
        >
          <ImpersonateForm workspaceId={w.id} workspaceName={w.name} />
          {w.stripe_customer_id && (
            <a
              href={`https://dashboard.stripe.com/customers/${w.stripe_customer_id}`}
              target="_blank"
              rel="noreferrer"
              className="op-btn"
            >
              <OpIcon name="stripe" />
              Open in Stripe
            </a>
          )}
          <a href={`http://${w.slug}.lvh.me:3000`} target="_blank" rel="noreferrer" className="op-btn">
            <OpIcon name="external" />
            Open workspace
          </a>
          {w.subscription_status === 'trialing' && (
            <ActionForm workspaceId={w.id} op="extend_trial" label="Extend trial 7d" icon="calendar" />
          )}
          {w.subscription_status === 'past_due' && (
            <ActionForm workspaceId={w.id} op="mark_active" label="Mark active" icon="check" primary />
          )}
          <ActionForm workspaceId={w.id} op="reset_password" label="Reset owner password" icon="key" />
          <div style={{ marginLeft: 'auto' }}>
            {w.subscription_status === 'frozen' ? (
              <ActionForm workspaceId={w.id} op="unfreeze" label="Unfreeze" icon="unlock" />
            ) : (
              <ActionForm workspaceId={w.id} op="suspend" label="Suspend" icon="lock" danger />
            )}
          </div>
        </div>
      </div>

      {/* Key numbers */}
      <div
        className="op-stats"
        style={{ marginBottom: 18, gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        <Stat k="Cocktails" v={cocktails ?? 0} />
        <Stat k="Creators" v={creators ?? 0} />
        <Stat k="Products" v={products ?? 0} />
        <Stat k="Custom ingredients" v={ingredients ?? 0} />
      </div>

      <div className="op-grid-2" style={{ marginBottom: 18 }}>
        {/* Details */}
        <div className="op-card">
          <div className="op-card-head">
            <h3>Workspace details</h3>
          </div>
          <div className="op-card-body">
            <dl className="op-kv">
              <dt>Workspace ID</dt>
              <dd className="mono">{w.id}</dd>
              <dt>Slug</dt>
              <dd className="mono">{w.slug}.shakebase.co</dd>
              <dt>Owner</dt>
              <dd>
                {ownerUser?.email ?? '—'}
                {ownerUser?.last_sign_in_at && (
                  <span className="mut mono" style={{ fontSize: 11, marginLeft: 8 }}>
                    last seen {timeAgo(ownerUser.last_sign_in_at)}
                  </span>
                )}
              </dd>
              <dt>Location</dt>
              <dd>{w.location ?? '—'}</dd>
              <dt>Created</dt>
              <dd>{fmtDate(w.created_at)}</dd>
              <dt>Stripe customer</dt>
              <dd className="mono">
                {w.stripe_customer_id ?? (
                  <span className="mut">— (dev mode or not yet paid)</span>
                )}
              </dd>
              {w.stripe_subscription_id && (
                <>
                  <dt>Subscription ID</dt>
                  <dd className="mono">{w.stripe_subscription_id}</dd>
                </>
              )}
              {w.trial_ends_at && (
                <>
                  <dt>Trial ends</dt>
                  <dd>
                    <span className="op-chip warn">{fmtDate(w.trial_ends_at)}</span>
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Members */}
        <div className="op-card">
          <div className="op-card-head">
            <h3>Members</h3>
            <span className="mut mono" style={{ fontSize: 11 }}>
              {memberRows.length}
            </span>
          </div>
          <div style={{ padding: 0 }}>
            {memberRows.length === 0 ? (
              <div className="op-empty">No active members.</div>
            ) : (
              memberRows.map((m) => {
                const u = usersMap.get(m.user_id)
                return (
                  <div
                    key={m.user_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 18px',
                      borderBottom: '1px solid var(--op-line-2)',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: 'var(--op-elev)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {(u?.email ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {u?.email ?? m.user_id.slice(0, 8)}
                      </div>
                      <div className="mut mono" style={{ fontSize: 10.5 }}>
                        joined {timeAgo(m.joined_at)}
                      </div>
                    </div>
                    <span className="op-chip">{m.role}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="op-grid-2">
        <div className="op-card">
          <div className="op-card-head">
            <h3>Recent cocktails</h3>
            <span className="mut mono" style={{ fontSize: 11 }}>
              Last 8 updated
            </span>
          </div>
          <div style={{ padding: 0 }}>
            {recent.length === 0 ? (
              <div className="op-empty">No cocktails in this workspace yet.</div>
            ) : (
              recent.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--op-line-2)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                    <div className="mut mono" style={{ fontSize: 10.5 }}>
                      updated {fmtDateTime(c.updated_at)}
                    </div>
                  </div>
                  <span className="op-chip">{c.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="op-card">
          <div className="op-card-head">
            <h3>Workspace audit trail</h3>
            <a href="/admin/audit" className="op-btn ghost sm">
              Full log →
            </a>
          </div>
          <div style={{ padding: 0 }}>
            {auditEvents.length === 0 ? (
              <div className="op-empty">No events recorded for this workspace yet.</div>
            ) : (
              auditEvents.map((e) => {
                const tone =
                  e.actor_kind === 'impersonation'
                    ? 'warn'
                    : e.actor_kind === 'admin'
                      ? 'accent'
                      : e.actor_kind === 'system'
                        ? 'info'
                        : ''
                return (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 18px',
                      borderBottom: '1px solid var(--op-line-2)',
                    }}
                  >
                    <span className={'op-chip ' + tone} style={{ fontSize: 9.5 }}>
                      {e.actor_kind === 'impersonation'
                        ? 'IMPERS'
                        : e.actor_kind.toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5 }}>
                        <b style={{ fontWeight: 500 }}>{e.actor_email ?? '—'}</b>{' '}
                        <span className="mut mono" style={{ fontSize: 11 }}>
                          {e.action}
                        </span>
                      </div>
                      <div className="mut mono" style={{ fontSize: 10.5, marginTop: 2 }}>
                        {timeAgo(e.at)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const IMPERSONATION_ERRORS: Record<string, string> = {
  no_owner: 'This workspace has no owner yet — can\u2019t impersonate.',
  no_email: 'Owner has no email address on file.',
  link_error: 'Failed to generate sign-in link for the owner.',
  verify_error: 'Session swap failed — token verification did not succeed.',
}

function ImpersonationError({ code }: { code: string }) {
  const msg = IMPERSONATION_ERRORS[code] ?? `Impersonation failed (${code}).`
  return (
    <div
      className="op-card"
      style={{
        padding: 14,
        marginBottom: 14,
        background: 'rgba(224,114,100,0.08)',
        border: '1px solid rgba(224,114,100,0.25)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <OpIcon name="warning" size={16} style={{ color: 'var(--op-crit)' }} />
      <div style={{ fontSize: 12.5 }}>
        <b style={{ fontWeight: 500 }}>{msg}</b>
      </div>
    </div>
  )
}

function Stat({ k, v }: { k: string; v: number }) {
  return (
    <div className="op-stat">
      <div className="k">{k}</div>
      <div className="v">{v.toLocaleString()}</div>
    </div>
  )
}

function ActionForm({
  workspaceId,
  op,
  label,
  icon,
  primary,
  danger,
}: {
  workspaceId: string
  op: string
  label: string
  icon: Parameters<typeof OpIcon>[0]['name']
  primary?: boolean
  danger?: boolean
}) {
  const cls = 'op-btn' + (primary ? ' primary' : danger ? ' danger' : '')
  return (
    <form action={`/admin/workspaces/${workspaceId}/action`} method="POST">
      <input type="hidden" name="op" value={op} />
      <button type="submit" className={cls}>
        <OpIcon name={icon} />
        {label}
      </button>
    </form>
  )
}

const ACTION_SUCCESS: Record<string, string> = {
  suspend_ok: 'Workspace suspended. Owner can no longer sign in.',
  unfreeze_ok: 'Workspace unfrozen and restored.',
  extend_trial_ok: 'Trial extended by 7 days.',
  mark_active_ok: 'Marked as active. Subscription restored.',
  reset_password_ok: 'Password reset link issued to the owner.',
}

const ACTION_ERROR: Record<string, string> = {
  already_frozen: 'Workspace is already frozen.',
  not_frozen: 'Workspace isn\u2019t frozen — nothing to unfreeze.',
  not_on_trial: 'Workspace isn\u2019t on trial.',
  not_past_due: 'Workspace isn\u2019t past-due.',
  no_owner: 'No owner on this workspace.',
  no_email: 'Owner has no email on file.',
  link_error: 'Could not generate the recovery link.',
  update_failed: 'Database update failed. Check logs.',
  unknown_op: 'Unknown action.',
}

function ActionToast({ action, reason }: { action: string; reason?: string }) {
  const ok = action.endsWith('_ok')
  const bg = ok ? 'rgba(95,181,138,0.08)' : 'rgba(224,114,100,0.08)'
  const border = ok ? 'rgba(95,181,138,0.25)' : 'rgba(224,114,100,0.25)'
  const icon = ok ? 'check' : 'warning'
  const tone = ok ? 'var(--op-ok)' : 'var(--op-crit)'
  const msg = ok
    ? (ACTION_SUCCESS[action] ?? 'Done.')
    : (ACTION_ERROR[reason ?? ''] ?? `Action failed (${reason ?? action}).`)
  return (
    <div
      className="op-card"
      style={{
        padding: 14,
        marginBottom: 14,
        background: bg,
        border: '1px solid ' + border,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <OpIcon name={icon} size={16} style={{ color: tone }} />
      <div style={{ fontSize: 12.5 }}>
        <b style={{ fontWeight: 500 }}>{msg}</b>
      </div>
    </div>
  )
}
