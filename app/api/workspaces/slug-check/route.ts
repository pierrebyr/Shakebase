import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SLUG_REGEX } from '@/lib/constants'

const RESERVED = new Set([
  'www',
  'admin',
  'api',
  'app',
  'dashboard',
  'mail',
  'support',
  'help',
  'docs',
  'blog',
  'status',
  'auth',
  'login',
  'signup',
  'pricing',
  'about',
])

export async function GET(req: Request) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')?.trim().toLowerCase() ?? ''

  if (!slug) {
    return NextResponse.json({ valid: false, reason: 'empty' }, { status: 400 })
  }
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json({ valid: false, reason: 'format' })
  }
  if (RESERVED.has(slug)) {
    return NextResponse.json({ valid: false, reason: 'reserved' })
  }

  const admin = createAdminClient()
  const { data } = await admin.from('workspaces').select('id').eq('slug', slug).maybeSingle()
  if (data) {
    return NextResponse.json({ valid: false, reason: 'taken' })
  }

  return NextResponse.json({ valid: true })
}
