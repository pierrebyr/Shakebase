import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import type { Database } from '@/lib/types/database'
import { cookieDomain } from '@/lib/cookies'

export async function createClient() {
  const cookieStore = await cookies()
  const h = await headers()
  const domain = cookieDomain(h.get('host'))

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...(options as CookieOptions), domain }),
            )
          } catch {
            // Read-only context (Server Components). Middleware refreshes cookies.
          }
        },
      },
    },
  )
}
