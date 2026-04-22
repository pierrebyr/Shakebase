import { NextResponse, type NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logAudit } from '@/lib/admin/audit'
import { cookieDomain, marketingUrl } from '@/lib/cookies'

// Called from the tenant impersonation banner. Closes the session,
// clears the marker cookie, and records the end event in the audit log.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies()
  const marker = cookieStore.get('sb_impersonation')?.value

  if (marker) {
    try {
      const parsed = JSON.parse(marker) as {
        admin_user_id?: string
        admin_email?: string
        workspace_id?: string
        owner_user_id?: string
        owner_email?: string
        started_at?: string
      }
      const startedAt = parsed.started_at ? new Date(parsed.started_at).getTime() : Date.now()
      const duration = Math.round((Date.now() - startedAt) / 1000)
      await logAudit({
        actorKind: 'admin',
        actorUserId: parsed.admin_user_id ?? null,
        actorEmail: parsed.admin_email ?? null,
        impersonatingAdminId: parsed.admin_user_id ?? null,
        action: 'impersonation.end',
        targetKind: 'user',
        targetId: parsed.owner_user_id ?? null,
        targetLabel: parsed.owner_email ?? null,
        workspaceId: parsed.workspace_id ?? null,
        meta: { duration_seconds: duration },
      })
    } catch {
      // Malformed cookie — still clear it.
    }
  }

  const supabase = await createServerSupabase()
  await supabase.auth.signOut()

  const hdr = await headers()
  const domain = cookieDomain(hdr.get('host'))
  cookieStore.set('sb_impersonation', '', {
    path: '/',
    domain,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  })

  return NextResponse.redirect(marketingUrl('/login?impersonation_ended=1'), { status: 303 })
}
