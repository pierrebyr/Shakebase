'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { workspaceUrl } from '@/lib/cookies'
import { createNotification } from '@/lib/notifications/create'

export type AcceptResult = { ok: true } | { ok: false; error: string }

const AcceptSchema = z.object({
  token: z.string().min(10),
  password: z.string().optional(),
  fullName: z.string().optional(),
})

export async function acceptInviteAction(_: unknown, formData: FormData): Promise<AcceptResult> {
  const parsed = AcceptSchema.safeParse({
    token: String(formData.get('token') ?? ''),
    password: String(formData.get('password') ?? ''),
    fullName: String(formData.get('fullName') ?? ''),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid form' }

  const admin = createAdminClient()
  const supabase = await createClient()

  // 1. Load invite
  const { data: inviteData } = await admin
    .from('memberships')
    .select(
      'id, workspace_id, role, invitation_email, invitation_expires_at, user_id, workspaces(slug, name)',
    )
    .eq('invitation_token', parsed.data.token)
    .maybeSingle()

  type InviteRow = {
    id: string
    workspace_id: string
    role: string
    invitation_email: string | null
    invitation_expires_at: string | null
    user_id: string | null
    workspaces: { slug: string; name: string } | null
  }
  const invite = inviteData as InviteRow | null

  if (!invite) return { ok: false, error: 'Invitation not found.' }
  if (invite.user_id) return { ok: false, error: 'Invitation already accepted.' }
  if (!invite.invitation_email || !invite.workspaces) {
    return { ok: false, error: 'Invitation is malformed.' }
  }
  if (invite.invitation_expires_at && new Date(invite.invitation_expires_at) < new Date()) {
    return { ok: false, error: 'This invitation has expired. Ask the owner for a new one.' }
  }

  const inviteEmail = invite.invitation_email.toLowerCase()

  // 2. Determine the user
  const { data: currentSession } = await supabase.auth.getUser()
  let userId: string | null = currentSession.user?.id ?? null
  const currentEmail = currentSession.user?.email?.toLowerCase() ?? null

  if (userId) {
    // Logged-in flow
    if (currentEmail && currentEmail !== inviteEmail) {
      return {
        ok: false,
        error: `You're signed in as ${currentEmail}. Sign out and try again with ${inviteEmail}.`,
      }
    }
  } else {
    // Sign-up flow
    if (!parsed.data.password || parsed.data.password.length < 8) {
      return { ok: false, error: 'Password must be at least 8 characters.' }
    }
    if (!parsed.data.fullName || parsed.data.fullName.trim().length < 2) {
      return { ok: false, error: 'Please enter your full name.' }
    }

    // Create auth user directly (email already verified by the invite link)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: inviteEmail,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName.trim() },
    })
    if (createErr || !created.user) {
      return { ok: false, error: createErr?.message ?? 'Could not create account.' }
    }
    userId = created.user.id
    // Ensure the profile row exists (handle_new_user trigger should cover this but upsert for safety)
    await admin.from('profiles').upsert({ id: userId, full_name: parsed.data.fullName.trim() })

    // Sign in to establish the browser session cookie
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: inviteEmail,
      password: parsed.data.password,
    })
    if (signInErr) {
      return { ok: false, error: signInErr.message }
    }
  }

  // 3. Link membership to this user
  const { error: linkErr } = await admin
    .from('memberships')
    .update({
      user_id: userId,
      joined_at: new Date().toISOString(),
      invitation_token: null,
      invitation_expires_at: null,
    } as never)
    .eq('id', invite.id)
  if (linkErr) return { ok: false, error: linkErr.message }

  // 4. Notify the workspace owner(s) that the invitee joined.
  const { data: owners } = await admin
    .from('memberships')
    .select('user_id')
    .eq('workspace_id', invite.workspace_id)
    .eq('role', 'owner')
    .not('joined_at', 'is', null)
  const ownerIds = ((owners ?? []) as { user_id: string | null }[])
    .map((o) => o.user_id)
    .filter((id): id is string => Boolean(id) && id !== userId)

  // Fan out notifications in parallel — each owner's delivery is
  // independent, so we don't wait serially. One bounced email shouldn't
  // block the invite flow either.
  const wsName = invite.workspaces.name
  const wsId = invite.workspace_id
  const role = invite.role
  await Promise.all(
    ownerIds.map((ownerId) =>
      createNotification({
        recipientUserId: ownerId,
        workspaceId: wsId,
        kind: 'invite.accepted',
        title: `${inviteEmail} accepted your invite`,
        body: `They just joined ${wsName} as ${role}.`,
        url: '/settings/team',
        actorUserId: userId,
        actorLabel: inviteEmail,
        email: {
          subject: `${inviteEmail} joined ${wsName}`,
          text: `${inviteEmail} accepted your invite and just joined ${wsName} as ${role}. You can manage the team at any time in the workspace settings.`,
        },
      }).catch((err) => {
        console.error('[accept-invite] notify owner failed:', ownerId, err)
        return { delivered: [] as ('in-app' | 'email')[] }
      }),
    ),
  )

  redirect(workspaceUrl(invite.workspaces.slug, '/dashboard'))
}
