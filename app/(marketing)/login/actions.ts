'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { workspaceUrl, marketingUrl, adminUrl } from '@/lib/cookies'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
})

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string }

export async function loginAction(_: unknown, formData: FormData): Promise<LoginResult> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  }

  // 5 attempts per 15 minutes per IP+email combo. Slows brute force
  // without blocking legitimate retries on typos.
  const ip = await clientIp()
  const rl = await rateLimit({
    key: `login:${ip}:${parsed.data.email.toLowerCase()}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  })
  if (!rl.ok) {
    return {
      ok: false,
      error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.`,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? 'Sign-in failed' }
  }

  // Resolve redirect: super-admin → admin panel; else first workspace; else onboarding message.
  const admin = createAdminClient()
  const { data: sa } = await admin.from('super_admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
  if (sa) {
    redirect(adminUrl('/admin'))
  }

  const { data: memberships } = await admin
    .from('memberships')
    .select('workspace_id, workspaces(slug)')
    .eq('user_id', data.user.id)
    .not('joined_at', 'is', null)
    .limit(1)

  const first = memberships?.[0] as { workspaces: { slug: string } | null } | undefined
  const slug = first?.workspaces?.slug
  if (slug) {
    redirect(workspaceUrl(slug, '/dashboard'))
  }

  // User has no workspace — push them to signup.
  redirect(marketingUrl('/signup'))
}
