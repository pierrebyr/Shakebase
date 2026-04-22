import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'
import { cookieDomain } from '@/lib/cookies'

// Pattern from Supabase SSR docs: create a response, bind the Supabase
// client to it, call getUser() so the client refreshes auth cookies onto
// the response. Cookies are rewritten with the parent domain so they
// survive cross-subdomain navigation.
export async function refreshSupabaseSession(request: NextRequest) {
  const domain = cookieDomain(request.headers.get('host'))

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, domain }),
          )
        },
      },
    },
  )

  // IMPORTANT: getUser() triggers the cookie refresh. Do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user, supabase }
}
