import 'server-only'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export type ActorKind = 'admin' | 'impersonation' | 'user' | 'system'

export type AuditEventInput = {
  actorKind: ActorKind
  actorUserId?: string | null
  actorEmail?: string | null
  impersonatingAdminId?: string | null
  action: string
  targetKind?: string | null
  targetId?: string | null
  targetLabel?: string | null
  workspaceId?: string | null
  meta?: Record<string, unknown>
}

export async function logAudit(e: AuditEventInput): Promise<void> {
  const admin = createAdminClient()
  const hdr = await headers()
  const ip =
    hdr.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdr.get('x-real-ip') ?? null
  const userAgent = hdr.get('user-agent') ?? null

  const payload = {
    actor_kind: e.actorKind,
    actor_user_id: e.actorUserId ?? null,
    actor_email: e.actorEmail ?? null,
    impersonating_admin_id: e.impersonatingAdminId ?? null,
    action: e.action,
    target_kind: e.targetKind ?? null,
    target_id: e.targetId ?? null,
    target_label: e.targetLabel ?? null,
    workspace_id: e.workspaceId ?? null,
    meta: e.meta ?? {},
    ip,
    user_agent: userAgent,
  }

  await admin.from('audit_events').insert(payload as never)
}
