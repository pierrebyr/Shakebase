import { NextResponse, type NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { logAudit } from '@/lib/admin/audit'
import { cookieDomain, workspaceUrl, adminUrl } from '@/lib/cookies'

// Impersonation session handoff.
//
// Flow: admin is currently signed in as themselves on admin.<root>.
// We swap their session to the workspace owner's session by generating
// a server-side magiclink and consuming it here. A sb_impersonation
// cookie records who the real admin is so the tenant shell can show a
// banner and the audit log can bind every action back.
//
// On exit, the owner session is signed out and the admin re-authenticates.
export async function POST(request: NextRequest): Promise<NextResponse> {
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
  const workspaceId = String(formData.get('workspace_id') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()
  if (!workspaceId) {
    return NextResponse.redirect(adminUrl('/admin/workspaces'), { status: 303 })
  }

  // Resolve workspace + owner
  const { data: ws } = await adminClient
    .from('workspaces')
    .select('id, slug, name')
    .eq('id', workspaceId)
    .maybeSingle()
  if (!ws) return NextResponse.redirect(adminUrl('/admin/workspaces'), { status: 303 })

  const { data: ownerMem } = await adminClient
    .from('memberships')
    .select('user_id')
    .eq('workspace_id', ws.id)
    .eq('role', 'owner')
    .not('joined_at', 'is', null)
    .maybeSingle()
  if (!ownerMem) {
    const target = new URL(`/admin/workspaces/${ws.id}?impersonate=no_owner`, adminUrl())
    return NextResponse.redirect(target, { status: 303 })
  }

  if (!ownerMem.user_id) {
    const target = new URL(`/admin/workspaces/${ws.id}?impersonate=no_owner`, adminUrl())
    return NextResponse.redirect(target, { status: 303 })
  }
  const { data: ownerUserRes } = await adminClient.auth.admin.getUserById(ownerMem.user_id)
  const ownerUser = ownerUserRes.user
  if (!ownerUser?.email) {
    const target = new URL(`/admin/workspaces/${ws.id}?impersonate=no_email`, adminUrl())
    return NextResponse.redirect(target, { status: 303 })
  }

  // Edge case: the admin IS the workspace owner. There's nothing to
  // impersonate — going through the sign-out + magic-link dance would sign
  // them in as themselves and set a banner showing "pierre impersonating
  // pierre". Skip all of that and just open the workspace directly.
  if (admin.id === ownerUser.id) {
    return NextResponse.redirect(workspaceUrl(ws.slug, '/dashboard'), { status: 303 })
  }

  // Write audit event FIRST — if the session swap fails, we still have a record.
  await logAudit({
    actorKind: 'admin',
    actorUserId: admin.id,
    actorEmail: admin.email ?? null,
    action: 'impersonation.start',
    targetKind: 'user',
    targetId: ownerUser.id,
    targetLabel: ownerUser.email,
    workspaceId: ws.id,
    meta: {
      reason: reason || null,
      workspace_name: ws.name,
      workspace_slug: ws.slug,
    },
  })

  // Generate a magiclink server-side. This does not email; we consume
  // the hashed_token here to swap sessions.
  const redirectTo = workspaceUrl(ws.slug, '/dashboard')
  const { data: linkRes, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: ownerUser.email,
    options: { redirectTo },
  })
  if (linkErr || !linkRes?.properties?.hashed_token) {
    const target = new URL(`/admin/workspaces/${ws.id}?impersonate=link_error`, adminUrl())
    return NextResponse.redirect(target, { status: 303 })
  }

  // Sign out the admin session, then sign in as the owner.
  const serverSupabase = await createServerSupabase()
  await serverSupabase.auth.signOut()

  const { error: verifyErr } = await serverSupabase.auth.verifyOtp({
    token_hash: linkRes.properties.hashed_token,
    type: 'magiclink',
  })
  if (verifyErr) {
    const target = new URL(`/admin/workspaces/${ws.id}?impersonate=verify_error`, adminUrl())
    return NextResponse.redirect(target, { status: 303 })
  }

  // Drop an impersonation marker cookie so tenant pages can show the banner
  // and /api/impersonate/end can close it out with an audit entry.
  const hdr = await headers()
  const domain = cookieDomain(hdr.get('host'))
  const cookieStore = await cookies()
  cookieStore.set(
    'sb_impersonation',
    JSON.stringify({
      admin_user_id: admin.id,
      admin_email: admin.email ?? null,
      workspace_id: ws.id,
      workspace_slug: ws.slug,
      workspace_name: ws.name,
      owner_user_id: ownerUser.id,
      owner_email: ownerUser.email,
      started_at: new Date().toISOString(),
    }),
    {
      path: '/',
      domain,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2,
    },
  )

  return NextResponse.redirect(redirectTo, { status: 303 })
}
