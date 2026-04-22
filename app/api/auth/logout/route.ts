import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { marketingUrl } from '@/lib/cookies'

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(marketingUrl('/'), { status: 303 })
}
