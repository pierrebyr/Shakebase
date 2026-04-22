import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/session'
import { toCsv } from '@/lib/csv'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

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
    .from('creators')
    .select(
      'name, role, venue, city, country, joined_year, signature, specialties, languages',
    )
    .eq('workspace_id', ws.id)
    .order('name')

  const rows = (data ?? []).map((c) => ({
    name: (c as { name: string }).name,
    role: (c as { role: string | null }).role ?? '',
    venue: (c as { venue: string | null }).venue ?? '',
    city: (c as { city: string | null }).city ?? '',
    country: (c as { country: string | null }).country ?? '',
    joined_year: (c as { joined_year: string | null }).joined_year ?? '',
    signature: (c as { signature: string | null }).signature ?? '',
    specialties: ((c as { specialties: string[] | null }).specialties ?? []).join(' · '),
    languages: ((c as { languages: string[] | null }).languages ?? []).join(' · '),
  }))

  const csv = toCsv(rows, [
    'name',
    'role',
    'venue',
    'city',
    'country',
    'joined_year',
    'signature',
    'specialties',
    'languages',
  ])
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${ws.slug}-creators.csv"`,
    },
  })
}
