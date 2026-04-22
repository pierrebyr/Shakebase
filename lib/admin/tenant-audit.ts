import 'server-only'
import { cookies } from 'next/headers'
import { logAudit, type ActorKind } from './audit'

export type ImpersonationMarker = {
  admin_user_id?: string
  admin_email?: string | null
  workspace_id?: string
  owner_user_id?: string
  owner_email?: string | null
  started_at?: string
}

export async function readImpersonation(): Promise<ImpersonationMarker | null> {
  const store = await cookies()
  const raw = store.get('sb_impersonation')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as ImpersonationMarker
  } catch {
    return null
  }
}

export async function isImpersonating(): Promise<boolean> {
  return (await readImpersonation()) !== null
}

type TenantAuditInput = {
  userId: string
  userEmail?: string | null
  workspaceId: string
  action: string
  targetKind?: string
  targetId?: string | null
  targetLabel?: string | null
  meta?: Record<string, unknown>
}

// Wrap every workspace mutation with this so the audit log has a complete
// record of who did what inside the tenant. If the session is currently
// impersonated by an admin, the event is tagged kind='impersonation' and
// the real admin ID is preserved on `impersonating_admin_id`.
export async function logTenantAction(e: TenantAuditInput): Promise<void> {
  const impersonation = await readImpersonation()
  const kind: ActorKind = impersonation ? 'impersonation' : 'user'
  await logAudit({
    actorKind: kind,
    actorUserId: e.userId,
    actorEmail: e.userEmail ?? null,
    impersonatingAdminId: impersonation?.admin_user_id ?? null,
    action: e.action,
    targetKind: e.targetKind ?? null,
    targetId: e.targetId ?? null,
    targetLabel: e.targetLabel ?? null,
    workspaceId: e.workspaceId,
    meta: {
      ...(e.meta ?? {}),
      ...(impersonation ? { impersonator_email: impersonation.admin_email } : {}),
    },
  })
}
