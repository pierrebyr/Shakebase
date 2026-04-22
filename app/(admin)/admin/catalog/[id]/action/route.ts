import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { logAudit } from '@/lib/admin/audit'
import { adminUrl } from '@/lib/cookies'

type RouteContext = { params: Promise<{ id: string }> }
type Outcome = { ok: boolean; code: string; meta?: Record<string, unknown> }

type Suggestion = {
  id: string
  kind: 'product' | 'ingredient'
  name: string
  category: string | null
  note: string | null
  brand: string | null
  expression: string | null
  abv: number | null
  origin: string | null
  description: string | null
  image_url: string | null
  default_unit: string | null
  allergens: string[] | null
  status: string
  suggested_from_workspace_id: string | null
}

export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: suggestionId } = await params
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
  const rejectionReason = String(formData.get('rejection_reason') ?? '').trim()
  const mergeTargetId = String(formData.get('merge_target_id') ?? '').trim()

  const { data: rawSug } = await adminClient
    .from('catalog_suggestions')
    .select(
      'id, kind, name, category, note, brand, expression, abv, origin, description, image_url, default_unit, allergens, status, suggested_from_workspace_id',
    )
    .eq('id', suggestionId)
    .maybeSingle()
  const sug = rawSug as unknown as Suggestion | null
  if (!sug) return NextResponse.redirect(adminUrl('/admin/catalog'), { status: 303 })
  if (sug.status !== 'pending') {
    return NextResponse.redirect(
      new URL('/admin/catalog?action=' + op + '_err&reason=not_pending', adminUrl()),
      { status: 303 },
    )
  }

  let outcome: Outcome

  switch (op) {
    case 'approve':
      outcome = await approve(adminClient, sug, admin.id)
      break
    case 'reject':
      outcome = await reject(adminClient, sug, admin.id, rejectionReason)
      break
    case 'merge':
      outcome = await merge(adminClient, sug, admin.id, mergeTargetId)
      break
    default:
      outcome = { ok: false, code: 'unknown_op' }
  }

  if (outcome.ok) {
    await logAudit({
      actorKind: 'admin',
      actorUserId: admin.id,
      actorEmail: admin.email ?? null,
      action: `catalog.${op}`,
      targetKind: 'catalog_suggestion',
      targetId: sug.id,
      targetLabel: `${sug.kind}: ${sug.name}${sug.brand ? ' / ' + sug.brand : ''}`,
      workspaceId: sug.suggested_from_workspace_id,
      meta: outcome.meta ?? {},
    })
  }

  const search = outcome.ok
    ? `?action=${op}_ok`
    : `?action=${op}_err&reason=${outcome.code}`
  return NextResponse.redirect(new URL('/admin/catalog' + search, adminUrl()), { status: 303 })
}

type SB = ReturnType<typeof createAdminClient>

async function approve(admin: SB, s: Suggestion, reviewerId: string): Promise<Outcome> {
  let canonicalId: string | null = null

  if (s.kind === 'product') {
    if (!s.brand || !s.expression || !s.category) {
      return { ok: false, code: 'missing_product_fields' }
    }
    const { data, error } = await admin
      .from('global_products')
      .insert({
        brand: s.brand,
        expression: s.expression,
        category: s.category,
        abv: s.abv,
        origin: s.origin,
        description: s.description,
        image_url: s.image_url,
      } as never)
      .select('id')
      .single<{ id: string }>()
    if (error || !data) {
      if (error?.code === '23505') return { ok: false, code: 'duplicate_product' }
      return { ok: false, code: 'insert_failed' }
    }
    canonicalId = data.id
  } else {
    if (!s.name) return { ok: false, code: 'missing_name' }
    const { data, error } = await admin
      .from('global_ingredients')
      .insert({
        name: s.name,
        category: s.category,
        default_unit: s.default_unit ?? 'ml',
        allergens: s.allergens ?? [],
      } as never)
      .select('id')
      .single<{ id: string }>()
    if (error || !data) {
      if (error?.code === '23505') return { ok: false, code: 'duplicate_ingredient' }
      return { ok: false, code: 'insert_failed' }
    }
    canonicalId = data.id
  }

  const { error: updErr } = await admin
    .from('catalog_suggestions')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      canonical_id: canonicalId,
    } as never)
    .eq('id', s.id)
  if (updErr) return { ok: false, code: 'update_failed' }

  return { ok: true, code: 'ok', meta: { canonical_id: canonicalId, kind: s.kind } }
}

async function reject(
  admin: SB,
  s: Suggestion,
  reviewerId: string,
  reason: string,
): Promise<Outcome> {
  const { error } = await admin
    .from('catalog_suggestions')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null,
    } as never)
    .eq('id', s.id)
  if (error) return { ok: false, code: 'update_failed' }
  return { ok: true, code: 'ok', meta: { reason: reason || null } }
}

async function merge(
  admin: SB,
  s: Suggestion,
  reviewerId: string,
  targetId: string,
): Promise<Outcome> {
  if (!targetId) return { ok: false, code: 'missing_target' }

  // Validate the target canonical row exists
  const table = s.kind === 'product' ? 'global_products' : 'global_ingredients'
  const { data: target } = await admin.from(table).select('id').eq('id', targetId).maybeSingle()
  if (!target) return { ok: false, code: 'target_not_found' }

  const { error } = await admin
    .from('catalog_suggestions')
    .update({
      status: 'merged',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      canonical_id: targetId,
    } as never)
    .eq('id', s.id)
  if (error) return { ok: false, code: 'update_failed' }
  return { ok: true, code: 'ok', meta: { merged_into: targetId } }
}
