import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { toCsv } from '@/lib/csv'
import { rateLimit, rateLimitErrorMessage } from '@/lib/rate-limit'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  // Exports touch the full workspace — cap at 5 per user per hour.
  const rl = await rateLimit({
    key: `export-cocktails:${user.id}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok) {
    return NextResponse.json(
      { error: rateLimitErrorMessage(rl.retryAfter) },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const slug = (await headers()).get('x-workspace-slug')
  if (!slug) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const admin = createAdminClient()
  const { data: ws } = await admin
    .from('workspaces')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  const { data: mem } = await admin
    .from('memberships')
    .select('role')
    .eq('workspace_id', ws.id)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)
    .maybeSingle()
  if (!mem) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await admin
    .from('cocktails')
    .select(
      'slug, name, status, category, spirit_base, glass_type, garnish, tasting_notes, menu_price_cents, cost_cents, created_at, updated_at, creators(name)',
    )
    .eq('workspace_id', ws.id)
    .neq('status', 'archived')
    .order('name')

  const rows = (data ?? []).map((c) => {
    const creator = (c as { creators: { name: string } | null }).creators
    return {
      slug: (c as { slug: string }).slug,
      name: (c as { name: string }).name,
      status: (c as { status: string }).status,
      category: (c as { category: string | null }).category ?? '',
      spirit: (c as { spirit_base: string | null }).spirit_base ?? '',
      glass: (c as { glass_type: string | null }).glass_type ?? '',
      garnish: (c as { garnish: string | null }).garnish ?? '',
      creator: creator?.name ?? '',
      tasting_notes: (c as { tasting_notes: string | null }).tasting_notes ?? '',
      menu_price_eur: (c as { menu_price_cents: number | null }).menu_price_cents
        ? ((c as { menu_price_cents: number }).menu_price_cents / 100).toFixed(2)
        : '',
      cost_eur: (c as { cost_cents: number | null }).cost_cents
        ? ((c as { cost_cents: number }).cost_cents / 100).toFixed(2)
        : '',
      created_at: (c as { created_at: string | null }).created_at ?? '',
      updated_at: (c as { updated_at: string | null }).updated_at ?? '',
    }
  })

  const csv = toCsv(rows, [
    'slug',
    'name',
    'status',
    'category',
    'spirit',
    'glass',
    'garnish',
    'creator',
    'tasting_notes',
    'menu_price_eur',
    'cost_eur',
    'created_at',
    'updated_at',
  ])
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${ws.slug}-cocktails.csv"`,
    },
  })
}
