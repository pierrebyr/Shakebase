'use server'

import { randomUUID } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'
import { marketingUrl } from '@/lib/cookies'
import { sendEmail } from '@/lib/email/send'
import { renderInvitation } from '@/lib/email/templates'
import { ROLES, type Role } from '@/lib/constants'
import { createNotification } from '@/lib/notifications/create'

const INVITE_EXPIRY_DAYS = 7

async function assertOwner(userId: string, workspaceId: string): Promise<void> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('memberships')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .not('joined_at', 'is', null)
    .maybeSingle()
  if (!data || (data as { role: string }).role !== 'owner') {
    throw new Error('Only the workspace owner can manage team')
  }
}

const InviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['editor', 'viewer']),
  message: z.string().optional(),
})

export type InviteResult =
  | { ok: true; provider: 'resend' | 'console'; acceptUrl: string }
  | { ok: false; error: string }

export async function inviteTeammateAction(_: unknown, formData: FormData): Promise<InviteResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()
  try {
    await assertOwner(user.id, workspace.id)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Forbidden' }
  }

  const parsed = InviteSchema.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    role: formData.get('role'),
    message: String(formData.get('message') ?? '').trim(),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  const { email, role } = parsed.data

  const admin = createAdminClient()

  const { data: existingActive } = await admin
    .from('memberships')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('invitation_email', email)
    .not('user_id', 'is', null)
    .maybeSingle()
  if (existingActive) {
    return { ok: false, error: 'Someone with that email is already a member.' }
  }

  await admin
    .from('memberships')
    .delete()
    .eq('workspace_id', workspace.id)
    .eq('invitation_email', email)
    .is('user_id', null)

  const token = randomUUID().replace(/-/g, '')
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await admin.from('memberships').insert({
    workspace_id: workspace.id,
    user_id: null,
    role,
    invitation_email: email,
    invitation_token: token,
    invitation_expires_at: expiresAt,
    invited_by: user.id,
  } as never)
  if (insertError) return { ok: false, error: insertError.message }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()
  const inviterName =
    (profile as { full_name: string | null } | null)?.full_name ?? user.email ?? 'A teammate'

  const acceptUrl = marketingUrl(`/accept-invite?token=${token}`)
  const rendered = renderInvitation({
    inviterName,
    inviterEmail: user.email ?? '',
    workspaceName: workspace.name,
    role,
    acceptUrl,
    expiresIn: `${INVITE_EXPIRY_DAYS} days`,
  })
  const result = await sendEmail({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  })

  await admin.from('audit_logs').insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: 'member.invite',
    target_type: 'membership',
    metadata: { email, role },
  } as never)

  revalidatePath('/settings/team')
  return { ok: true, provider: result.provider, acceptUrl }
}

const RevokeSchema = z.object({ membership_id: z.string().uuid() })

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()
  await assertOwner(user.id, workspace.id)

  const parsed = RevokeSchema.safeParse({ membership_id: formData.get('membership_id') })
  if (!parsed.success) throw new Error('Invalid form')

  const admin = createAdminClient()
  await admin
    .from('memberships')
    .delete()
    .eq('id', parsed.data.membership_id)
    .eq('workspace_id', workspace.id)
    .is('user_id', null)
  revalidatePath('/settings/team')
}

const ResendSchema = z.object({ membership_id: z.string().uuid() })

export async function resendInviteAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()
  await assertOwner(user.id, workspace.id)

  const parsed = ResendSchema.safeParse({ membership_id: formData.get('membership_id') })
  if (!parsed.success) throw new Error('Invalid form')

  const admin = createAdminClient()
  const { data: inv } = await admin
    .from('memberships')
    .select('id, role, invitation_email, invitation_token')
    .eq('id', parsed.data.membership_id)
    .eq('workspace_id', workspace.id)
    .maybeSingle()
  const invite = inv as { id: string; role: Role; invitation_email: string; invitation_token: string } | null
  if (!invite || !invite.invitation_token) throw new Error('Invite not found')

  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await admin
    .from('memberships')
    .update({ invitation_expires_at: expiresAt } as never)
    .eq('id', invite.id)

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()
  const inviterName = (profile as { full_name: string | null } | null)?.full_name ?? user.email ?? 'A teammate'

  const acceptUrl = marketingUrl(`/accept-invite?token=${invite.invitation_token}`)
  const rendered = renderInvitation({
    inviterName,
    inviterEmail: user.email ?? '',
    workspaceName: workspace.name,
    role: invite.role,
    acceptUrl,
    expiresIn: `${INVITE_EXPIRY_DAYS} days`,
  })
  await sendEmail({
    to: invite.invitation_email,
    subject: `Reminder: ${rendered.subject}`,
    html: rendered.html,
    text: rendered.text,
  })

  revalidatePath('/settings/team')
}

const RoleChangeSchema = z.object({
  membership_id: z.string().uuid(),
  role: z.enum(ROLES),
})

export async function changeRoleAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()
  await assertOwner(user.id, workspace.id)

  const parsed = RoleChangeSchema.safeParse({
    membership_id: formData.get('membership_id'),
    role: formData.get('role'),
  })
  if (!parsed.success) throw new Error('Invalid form')

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('memberships')
    .select('user_id, role')
    .eq('id', parsed.data.membership_id)
    .maybeSingle()
  const targetRow = target as { user_id: string | null; role: Role } | null
  if (targetRow?.user_id === user.id && parsed.data.role !== 'owner') {
    throw new Error("You can't demote yourself. Transfer ownership first.")
  }

  await admin
    .from('memberships')
    .update({ role: parsed.data.role } as never)
    .eq('id', parsed.data.membership_id)
    .eq('workspace_id', workspace.id)

  await admin.from('audit_logs').insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: 'member.role_change',
    target_type: 'membership',
    target_id: parsed.data.membership_id,
    metadata: { role: parsed.data.role },
  } as never)

  // Notify the affected user that their role changed.
  if (targetRow?.user_id && targetRow.user_id !== user.id) {
    await createNotification({
      recipientUserId: targetRow.user_id,
      workspaceId: workspace.id,
      kind: 'member.role_changed',
      title: `Your role is now ${parsed.data.role}`,
      body: `${user.email ?? 'An owner'} changed your role in ${workspace.name}.`,
      url: '/settings/team',
      actorUserId: user.id,
      actorLabel: user.email ?? null,
      meta: { role: parsed.data.role, previous_role: targetRow.role },
      email: {
        subject: `Your role in ${workspace.name} changed to ${parsed.data.role}`,
        text: `Hi — ${user.email ?? 'an owner'} changed your role in ${workspace.name} to ${parsed.data.role}. You can review your access at any time in the team settings.`,
      },
    })
  }

  revalidatePath('/settings/team')
}

const RemoveSchema = z.object({ membership_id: z.string().uuid() })

export async function removeMemberAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()
  await assertOwner(user.id, workspace.id)

  const parsed = RemoveSchema.safeParse({ membership_id: formData.get('membership_id') })
  if (!parsed.success) throw new Error('Invalid form')

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('memberships')
    .select('user_id, role')
    .eq('id', parsed.data.membership_id)
    .maybeSingle()
  const targetRow = target as { user_id: string | null; role: Role } | null
  if (targetRow?.user_id === user.id) {
    throw new Error("You can't remove yourself.")
  }

  // Notify BEFORE removing so we still have the user_id on the row for free.
  if (targetRow?.user_id && targetRow.user_id !== user.id) {
    await createNotification({
      recipientUserId: targetRow.user_id,
      workspaceId: workspace.id,
      kind: 'member.removed',
      title: `You were removed from ${workspace.name}`,
      body: `${user.email ?? 'An owner'} removed your access. Reach out to them if this wasn't expected.`,
      actorUserId: user.id,
      actorLabel: user.email ?? null,
      email: {
        subject: `You were removed from ${workspace.name}`,
        text: `Hi — ${user.email ?? 'an owner'} removed your access to ${workspace.name} on ShakeBase. If this wasn't expected, reach out to them directly.`,
      },
    })
  }

  await admin
    .from('memberships')
    .delete()
    .eq('id', parsed.data.membership_id)
    .eq('workspace_id', workspace.id)

  await admin.from('audit_logs').insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: 'member.remove',
    target_type: 'membership',
    target_id: parsed.data.membership_id,
  } as never)

  revalidatePath('/settings/team')
}

const TransferSchema = z.object({
  membership_id: z.string().uuid(),
  confirm: z.string(),
})

export async function transferOwnershipAction(_: unknown, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()
  try {
    await assertOwner(user.id, workspace.id)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Forbidden' }
  }

  const parsed = TransferSchema.safeParse({
    membership_id: formData.get('membership_id'),
    confirm: String(formData.get('confirm') ?? ''),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid form' }

  if (parsed.data.confirm.trim() !== workspace.name) {
    return { ok: false, error: `Type "${workspace.name}" exactly to confirm.` }
  }

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('memberships')
    .select('user_id')
    .eq('id', parsed.data.membership_id)
    .eq('workspace_id', workspace.id)
    .not('user_id', 'is', null)
    .maybeSingle()
  const newOwnerUserId = (target as { user_id: string } | null)?.user_id
  if (!newOwnerUserId) return { ok: false, error: 'New owner not found' }

  // Swap: promote target to owner, demote self to editor
  await admin
    .from('memberships')
    .update({ role: 'owner' } as never)
    .eq('id', parsed.data.membership_id)
  await admin
    .from('memberships')
    .update({ role: 'editor' } as never)
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)

  await admin
    .from('workspaces')
    .update({ owner_user_id: newOwnerUserId } as never)
    .eq('id', workspace.id)

  await admin.from('audit_logs').insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: 'workspace.ownership_transfer',
    target_type: 'user',
    target_id: newOwnerUserId,
  } as never)

  revalidatePath('/settings/team')
  return { ok: true }
}

const DeleteWorkspaceSchema = z.object({ confirm: z.string() })

export async function deleteWorkspaceAction(_: unknown, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()
  try {
    await assertOwner(user.id, workspace.id)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Forbidden' }
  }

  const parsed = DeleteWorkspaceSchema.safeParse({
    confirm: String(formData.get('confirm') ?? ''),
  })
  if (!parsed.success || parsed.data.confirm.trim() !== workspace.name) {
    return { ok: false, error: `Type "${workspace.name}" exactly to confirm.` }
  }

  const admin = createAdminClient()
  await admin.from('workspaces').delete().eq('id', workspace.id)

  redirect(marketingUrl('/'))
}

const UpdateLocationSchema = z.object({ location: z.string().optional() })

export async function updateWorkspaceLocationAction(formData: FormData): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('Not signed in')
  const workspace = await getCurrentWorkspace()
  await assertOwner(user.id, workspace.id)

  const parsed = UpdateLocationSchema.safeParse({
    location: String(formData.get('location') ?? '').trim(),
  })
  if (!parsed.success) throw new Error('Invalid form')

  const admin = createAdminClient()
  await admin
    .from('workspaces')
    .update({ location: parsed.data.location || null } as never)
    .eq('id', workspace.id)
  revalidatePath('/settings/team')
}
