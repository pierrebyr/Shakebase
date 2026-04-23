'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SLUG_REGEX, TRIAL_DAYS } from '@/lib/constants'
import { createTrialCheckoutSession } from '@/lib/stripe/checkout'
import { stripeConfigured } from '@/lib/stripe/client'
import { workspaceUrl } from '@/lib/cookies'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/send'
import { renderWelcome } from '@/lib/email/templates'

const RESERVED = new Set([
  'www', 'admin', 'api', 'app', 'dashboard', 'mail', 'support',
  'help', 'docs', 'blog', 'status', 'auth', 'login', 'signup', 'pricing', 'about',
])

const SignupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name required'),
  workspaceName: z.string().min(2, 'Workspace name required'),
  slug: z.string().regex(SLUG_REGEX, 'Slug: lowercase letters, numbers, dashes (3-40 chars)'),
  plan: z.enum(['creator', 'starter', 'studio']).default('studio'),
})

export type SignupResult =
  | { ok: true }
  | { ok: false; error: string; field?: 'email' | 'password' | 'fullName' | 'workspaceName' | 'slug' }

export async function signupAction(_: unknown, formData: FormData): Promise<SignupResult> {
  // Cap signups per IP to 3 per hour to slow bulk-workspace spam.
  const ip = await clientIp()
  const rl = await rateLimit({
    key: `signup:${ip}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok) {
    return {
      ok: false,
      error: `Too many workspace creations from this network. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.`,
    }
  }

  const raw = {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    fullName: String(formData.get('fullName') ?? ''),
    workspaceName: String(formData.get('workspaceName') ?? ''),
    slug: String(formData.get('slug') ?? '').toLowerCase(),
    plan: String(formData.get('plan') ?? 'studio'),
  }
  const parsed = SignupSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Invalid form',
      field: (issue?.path[0] as SignupResult extends { field?: infer F } ? F : never) ?? undefined,
    }
  }
  const input = parsed.data

  if (RESERVED.has(input.slug)) {
    return { ok: false, error: 'This subdomain is reserved.', field: 'slug' }
  }

  const admin = createAdminClient()

  // Preflight slug uniqueness — cheaper than a post-signup rollback.
  const { data: existing } = await admin
    .from('workspaces')
    .select('id')
    .eq('slug', input.slug)
    .maybeSingle()
  if (existing) {
    return { ok: false, error: 'This subdomain is taken.', field: 'slug' }
  }

  // 1. Create auth user (goes through browser-context supabase so cookies are set)
  const supabase = await createClient()
  const { data: signup, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.fullName } },
  })
  if (signUpError || !signup.user) {
    return { ok: false, error: signUpError?.message ?? 'Could not create account', field: 'email' }
  }
  const userId = signup.user.id

  // 2. Create workspace + membership + settings + notif prefs (admin client, bypasses RLS)
  // Creator tier: free forever — reuse the existing 'gifted' subscription
  // state so nothing ever charges, no trial clock. Starter/Studio go through
  // the normal trial → Stripe-checkout flow.
  const isCreatorPlan = input.plan === 'creator'
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: ws, error: wsError } = await admin
    .from('workspaces')
    .insert({
      slug: input.slug,
      name: input.workspaceName,
      owner_user_id: userId,
      plan: input.plan,
      subscription_status: isCreatorPlan
        ? 'gifted'
        : stripeConfigured()
          ? 'pending_payment'
          : 'trialing',
      trial_ends_at: isCreatorPlan ? null : stripeConfigured() ? null : trialEndsAt,
    } as never)
    .select('id, slug')
    .single()

  if (wsError || !ws) {
    // Rollback: delete the orphan auth user
    await admin.auth.admin.deleteUser(userId)
    return { ok: false, error: wsError?.message ?? 'Could not create workspace' }
  }

  const workspaceId = ws.id as string

  await admin.from('memberships').insert({
    workspace_id: workspaceId,
    user_id: userId,
    role: 'owner',
    joined_at: new Date().toISOString(),
  })

  await admin.from('workspace_settings').insert({ workspace_id: workspaceId })

  await admin.from('user_notification_prefs').insert({
    user_id: userId,
    workspace_id: workspaceId,
  })

  await admin.from('profiles').upsert({ id: userId, full_name: input.fullName })

  // Fire-and-forget welcome email. Don't block signup on delivery.
  const firstName = input.fullName.trim().split(/\s+/)[0] ?? input.fullName
  const base = workspaceUrl(input.slug, '')
  const welcome = renderWelcome({
    firstName,
    workspaceUrl: workspaceUrl(input.slug, '/dashboard'),
    newCocktailUrl: `${base}/cocktails/new`,
    ingredientsUrl: `${base}/ingredients`,
    inviteTeamUrl: `${base}/settings/team`,
  })
  sendEmail({
    to: input.email,
    subject: welcome.subject,
    html: welcome.html,
    text: welcome.text,
  }).catch((err) => console.error('[signup] welcome email failed:', err))

  // 3. Stripe Checkout (skipped for Creator tier and when Stripe isn't configured)
  if (!isCreatorPlan && stripeConfigured()) {
    const checkoutUrl = await createTrialCheckoutSession({
      workspaceId,
      workspaceSlug: input.slug,
      customerEmail: input.email,
    })
    if (checkoutUrl) redirect(checkoutUrl)
  }

  // Dev path: straight to onboarding
  redirect(workspaceUrl(input.slug, '/onboarding'))
}
