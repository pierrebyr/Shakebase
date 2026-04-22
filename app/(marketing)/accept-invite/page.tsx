import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { AcceptInviteForm } from './AcceptInviteForm'

type Props = { searchParams: Promise<{ token?: string }> }

type InviteRow = {
  id: string
  role: string
  invitation_email: string | null
  invitation_expires_at: string | null
  user_id: string | null
  workspaces: { slug: string; name: string } | null
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams
  if (!token) {
    return (
      <ErrorPanel
        title="Missing token"
        message="Your invitation link is incomplete. Ask the owner to re-send it."
      />
    )
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('memberships')
    .select(
      'id, role, invitation_email, invitation_expires_at, user_id, workspaces(slug, name)',
    )
    .eq('invitation_token', token)
    .maybeSingle()
  const invite = data as InviteRow | null

  if (!invite || !invite.workspaces || !invite.invitation_email) {
    return (
      <ErrorPanel
        title="Invitation not found"
        message="This invite doesn't exist anymore. It may have been revoked. Ask the owner for a new one."
      />
    )
  }
  if (invite.user_id) {
    return (
      <ErrorPanel
        title="Already accepted"
        message="This invitation was already used. Try signing in."
      />
    )
  }
  if (invite.invitation_expires_at && new Date(invite.invitation_expires_at) < new Date()) {
    return (
      <ErrorPanel
        title="Invitation expired"
        message="This invite is no longer valid. Ask the owner to send a fresh one."
      />
    )
  }

  const user = await getUser()
  const signedInEmail = user?.email?.toLowerCase() ?? null
  const inviteEmail = invite.invitation_email.toLowerCase()
  const emailMatch = signedInEmail === inviteEmail

  return (
    <main className="page" style={{ maxWidth: 460, paddingTop: 72 }}>
      <div className="page-kicker">You&apos;re invited</div>
      <h1 className="page-title" style={{ fontSize: 40, textWrap: 'balance' }}>
        Join {invite.workspaces.name}.
      </h1>
      <p className="page-sub">
        You&apos;ve been invited to collaborate as a{' '}
        <span style={{ color: 'var(--accent-ink)', fontWeight: 500, textTransform: 'capitalize' }}>
          {invite.role}
        </span>{' '}
        on ShakeBase.
      </p>

      <div style={{ marginTop: 24 }}>
        <AcceptInviteForm
          token={token}
          email={invite.invitation_email}
          workspaceName={invite.workspaces.name}
          role={invite.role}
          signedInEmail={signedInEmail}
          emailMatch={emailMatch}
        />
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-4)', textAlign: 'center' }}>
        By joining, you agree to ShakeBase&apos;s terms.
      </p>
    </main>
  )
}

function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <main className="page" style={{ maxWidth: 460, paddingTop: 72 }}>
      <div className="page-kicker">Invitation</div>
      <h1 className="page-title" style={{ fontSize: 36 }}>
        {title}
      </h1>
      <p className="page-sub">{message}</p>
      <Link href="/" className="btn-secondary" style={{ marginTop: 18 }}>
        Back to ShakeBase
      </Link>
    </main>
  )
}
