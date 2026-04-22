import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { logAudit } from '@/lib/admin/audit'
import { adminUrl } from '@/lib/cookies'

type RouteContext = { params: Promise<{ id: string }> }

type Outcome = { ok: boolean; code: string; meta?: Record<string, unknown> }

export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: workspaceId } = await params
  const admin = await getUser()
  if (!admin) return NextResponse.redirect(adminUrl('/login'), { status: 303 })

  const adminClient = createAdminClient()
  const { data: isAdmin } = await adminClient
    .from('super_admins')
    .select('user_id')
    .eq('user_id', admin.id)
    .maybeSingle()
  if (!isAdmin) return NextResponse.redirect(adminUrl('/login'), { status: 303 })

  const formData = await request.formData()
  const op = String(formData.get('op') ?? '')

  const { data: ws } = await adminClient
    .from('workspaces')
    .select('id, slug, name, subscription_status, trial_ends_at')
    .eq('id', workspaceId)
    .maybeSingle()
  if (!ws) {
    return NextResponse.redirect(adminUrl('/admin/workspaces'), { status: 303 })
  }

  let outcome: Outcome

  switch (op) {
    case 'suspend':
      outcome = await suspend(adminClient, ws)
      break
    case 'unfreeze':
      outcome = await unfreeze(adminClient, ws)
      break
    case 'extend_trial':
      outcome = await extendTrial(adminClient, ws)
      break
    case 'mark_active':
      outcome = await markActive(adminClient, ws)
      break
    case 'gift':
      outcome = await gift(adminClient, ws)
      break
    case 'ungift':
      outcome = await ungift(adminClient, ws)
      break
    case 'reset_password':
      outcome = await resetOwnerPassword(adminClient, ws)
      break
    default:
      outcome = { ok: false, code: 'unknown_op' }
  }

  if (outcome.ok) {
    await logAudit({
      actorKind: 'admin',
      actorUserId: admin.id,
      actorEmail: admin.email ?? null,
      action: `workspace.${op}`,
      targetKind: 'workspace',
      targetId: ws.id,
      targetLabel: ws.name,
      workspaceId: ws.id,
      meta: outcome.meta ?? {},
    })
  }

  const search = outcome.ok ? `?action=${op}_ok` : `?action=${op}_err&reason=${outcome.code}`
  return NextResponse.redirect(
    new URL(`/admin/workspaces/${ws.id}${search}`, adminUrl()),
    { status: 303 },
  )
}

type Supabase = ReturnType<typeof createAdminClient>
type Ws = {
  id: string
  slug: string
  name: string
  subscription_status: string
  trial_ends_at: string | null
}

async function suspend(admin: Supabase, ws: Ws): Promise<Outcome> {
  if (ws.subscription_status === 'frozen') {
    return { ok: false, code: 'already_frozen' }
  }
  const { error } = await admin
    .from('workspaces')
    .update({ subscription_status: 'frozen' } as never)
    .eq('id', ws.id)
  if (error) return { ok: false, code: 'update_failed' }
  return { ok: true, code: 'ok', meta: { previous_status: ws.subscription_status } }
}

async function unfreeze(admin: Supabase, ws: Ws): Promise<Outcome> {
  if (ws.subscription_status !== 'frozen') {
    return { ok: false, code: 'not_frozen' }
  }
  // Restore to 'active' unless trial is still valid, then 'trialing'.
  const next =
    ws.trial_ends_at && new Date(ws.trial_ends_at).getTime() > Date.now()
      ? 'trialing'
      : 'active'
  const { error } = await admin
    .from('workspaces')
    .update({ subscription_status: next } as never)
    .eq('id', ws.id)
  if (error) return { ok: false, code: 'update_failed' }
  return { ok: true, code: 'ok', meta: { restored_to: next } }
}

async function extendTrial(admin: Supabase, ws: Ws): Promise<Outcome> {
  if (ws.subscription_status !== 'trialing') {
    return { ok: false, code: 'not_on_trial' }
  }
  const base =
    ws.trial_ends_at && new Date(ws.trial_ends_at).getTime() > Date.now()
      ? new Date(ws.trial_ends_at)
      : new Date()
  const next = new Date(base.getTime() + 7 * 86400000)
  const { error } = await admin
    .from('workspaces')
    .update({ trial_ends_at: next.toISOString() } as never)
    .eq('id', ws.id)
  if (error) return { ok: false, code: 'update_failed' }
  return { ok: true, code: 'ok', meta: { trial_ends_at: next.toISOString(), added_days: 7 } }
}

async function markActive(admin: Supabase, ws: Ws): Promise<Outcome> {
  if (ws.subscription_status !== 'past_due') {
    return { ok: false, code: 'not_past_due' }
  }
  const { error } = await admin
    .from('workspaces')
    .update({ subscription_status: 'active' } as never)
    .eq('id', ws.id)
  if (error) return { ok: false, code: 'update_failed' }
  return { ok: true, code: 'ok', meta: { previous_status: ws.subscription_status } }
}

async function gift(admin: Supabase, ws: Ws): Promise<Outcome> {
  if (ws.subscription_status === 'gifted') {
    return { ok: false, code: 'already_gifted' }
  }
  const { error } = await admin
    .from('workspaces')
    .update({
      subscription_status: 'gifted',
      // Clear the trial clock — gifted workspaces are outside the billing
      // loop entirely, so the trial countdown would be misleading.
      trial_ends_at: null,
      frozen_at: null,
    } as never)
    .eq('id', ws.id)
  if (error) return { ok: false, code: 'update_failed' }
  return { ok: true, code: 'ok', meta: { previous_status: ws.subscription_status } }
}

async function ungift(admin: Supabase, ws: Ws): Promise<Outcome> {
  if (ws.subscription_status !== 'gifted') {
    return { ok: false, code: 'not_gifted' }
  }
  // Drop back to 'active' — if there's a Stripe subscription it'll take over
  // billing cycle naturally; otherwise the owner can set up billing from
  // Settings → Billing.
  const { error } = await admin
    .from('workspaces')
    .update({ subscription_status: 'active' } as never)
    .eq('id', ws.id)
  if (error) return { ok: false, code: 'update_failed' }
  return { ok: true, code: 'ok' }
}

async function resetOwnerPassword(admin: Supabase, ws: Ws): Promise<Outcome> {
  const { data: ownerMem } = await admin
    .from('memberships')
    .select('user_id')
    .eq('workspace_id', ws.id)
    .eq('role', 'owner')
    .not('joined_at', 'is', null)
    .maybeSingle()
  if (!ownerMem?.user_id) return { ok: false, code: 'no_owner' }
  const { data: userRes } = await admin.auth.admin.getUserById(ownerMem.user_id)
  const ownerEmail = userRes.user?.email
  if (!ownerEmail) return { ok: false, code: 'no_email' }

  const { error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: ownerEmail,
  })
  if (error) return { ok: false, code: 'link_error' }
  return { ok: true, code: 'ok', meta: { owner_email: ownerEmail } }
}
