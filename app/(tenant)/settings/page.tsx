import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/session'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { ProfileForm } from './ProfileForm'

export default async function SettingsPage() {
  const user = await requireUser()
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('full_name, job_title, department, language, time_zone')
    .eq('id', user.id)
    .maybeSingle()
  const profile = data as {
    full_name: string | null
    job_title: string | null
    department: string | null
    language: string | null
    time_zone: string | null
  } | null

  const isOwner = workspace.owner_user_id === user.id

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">Account</div>
        <h1 className="page-title">Profile.</h1>
        <p className="page-sub">
          How you show up across {workspace.name}. Your name and avatar appear on every cocktail
          you edit.
        </p>
      </div>

      <div className="card card-pad" style={{ padding: 28 }}>
        <div className="panel-title" style={{ marginBottom: 18 }}>
          Profile
        </div>
        <ProfileForm
          initial={{
            full_name: profile?.full_name ?? null,
            job_title: profile?.job_title ?? null,
            department: profile?.department ?? null,
            language: profile?.language ?? null,
            time_zone: profile?.time_zone ?? null,
          }}
          email={user.email ?? null}
        />
      </div>

      {isOwner && (
        <div className="card card-pad" style={{ padding: 28 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>
            Workspace
          </div>
          <Row label="Name" value={workspace.name} />
          <Row label="Subdomain" value={`${workspace.slug}.shakebase.co`} mono />
          <Row label="Subscription" value={workspace.subscription_status} mono />
          {workspace.trial_ends_at && (
            <Row
              label="Trial ends"
              value={new Date(workspace.trial_ends_at).toLocaleDateString()}
              mono
            />
          )}
        </div>
      )}

      <form action="/api/auth/logout" method="POST">
        <button type="submit" className="btn-secondary" style={{ color: 'var(--crit)' }}>
          Sign out
        </button>
      </form>
    </>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        padding: '14px 0',
        borderBottom: '1px solid var(--line-2)',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{label}</span>
      <span
        style={{
          fontSize: 13.5,
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          color: 'var(--ink-1)',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  )
}
