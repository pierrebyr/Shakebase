import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { AuthShell } from '@/components/auth/AuthShell'
import { AcceptInviteArt } from '@/components/auth/AcceptInviteArt'
import { AcceptInviteForm } from './AcceptInviteForm'
import '../auth.css'

export const metadata = {
  title: 'Accept invitation · ShakeBase',
  description: 'Accept your invitation to join a ShakeBase workspace.',
  alternates: { canonical: '/accept-invite' },
}

type Props = { searchParams: Promise<{ token?: string }> }

type InviteRow = {
  id: string
  role: string
  invitation_email: string | null
  invitation_expires_at: string | null
  user_id: string | null
  invited_by: string | null
  workspaces: { slug: string; name: string } | null
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams
  if (!token) {
    return (
      <ErrorState
        title="Missing token"
        message="Your invitation link is incomplete. Ask the workspace owner to re-send it."
      />
    )
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('memberships')
    .select(
      'id, role, invitation_email, invitation_expires_at, user_id, invited_by, workspaces(slug, name)',
    )
    .eq('invitation_token', token)
    .maybeSingle()
  const invite = data as InviteRow | null

  if (!invite || !invite.workspaces || !invite.invitation_email) {
    return (
      <ErrorState
        title="Invitation not found"
        message="This invite doesn't exist anymore. It may have been revoked. Ask the owner for a fresh one."
      />
    )
  }
  if (invite.user_id) {
    return (
      <ErrorState
        title="Already accepted"
        message="This invitation was already used. Try signing in instead."
      />
    )
  }
  if (invite.invitation_expires_at && new Date(invite.invitation_expires_at) < new Date()) {
    return (
      <ErrorState
        title="Invitation expired"
        message="This invite is no longer valid. Ask the owner to send a fresh one."
      />
    )
  }

  const user = await getUser()
  const signedInEmail = user?.email?.toLowerCase() ?? null
  const inviteEmail = invite.invitation_email.toLowerCase()
  const emailMatch = signedInEmail === inviteEmail

  // Resolve the inviter's name so the side-art can personalise the CTA.
  let inviterName: string | null = null
  if (invite.invited_by) {
    const { data: inviter } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', invite.invited_by)
      .maybeSingle()
    inviterName = (inviter as { full_name: string | null } | null)?.full_name ?? null
  }

  return (
    <AuthShell
      envPill={invite.role.toUpperCase()}
      helpText="Already have a ShakeBase account?"
      helpHref="/login"
      helpLink="Sign in →"
      kicker={`You're invited · ${invite.workspaces.name}`}
      title={
        <>
          Join{' '}
          <span style={{ fontStyle: 'italic' }}>{invite.workspaces.name}.</span>
        </>
      }
      sub={
        <>
          You&apos;ve been invited to collaborate as a{' '}
          <span style={{ color: 'var(--accent-ink)', fontWeight: 500, textTransform: 'capitalize' }}>
            {invite.role}
          </span>
          . Create your account below — it only takes a minute.
        </>
      }
      art={
        <AcceptInviteArt
          workspaceName={invite.workspaces.name}
          role={invite.role}
          inviterName={inviterName}
        />
      }
    >
      <AcceptInviteForm
        token={token}
        email={invite.invitation_email}
        workspaceName={invite.workspaces.name}
        role={invite.role}
        signedInEmail={signedInEmail}
        emailMatch={emailMatch}
      />
      <p
        style={{
          marginTop: 16,
          fontSize: 11.5,
          color: 'var(--ink-4)',
          textAlign: 'center',
          lineHeight: 1.55,
        }}
      >
        By joining, you agree to ShakeBase&apos;s{' '}
        <Link href="/terms" style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--line-1)' }}>
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--line-1)' }}>
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  )
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <AuthShell
      envPill="Invite"
      helpText="Need a new invitation?"
      helpHref="/contact"
      helpLink="Contact us →"
      kicker="Invitation"
      title={<>{title}</>}
      sub={<>{message}</>}
      art={<AcceptInviteArt workspaceName="ShakeBase" role="editor" />}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <Link href="/" className="auth-submit" style={{ textDecoration: 'none' }}>
          Back to ShakeBase
          <span className="arrow">→</span>
        </Link>
      </div>
    </AuthShell>
  )
}
