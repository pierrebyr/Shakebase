'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { sendEmail } from '@/lib/email/send'
import { renderPasswordChanged } from '@/lib/email/templates'
import { marketingUrl } from '@/lib/cookies'

const ChangePasswordSchema = z
  .object({
    current: z.string().min(1, 'Current password required'),
    next: z.string().min(8, 'New password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: "New password and confirmation don't match",
    path: ['confirm'],
  })

export type PasswordResult = { ok: true } | { ok: false; error: string }

export async function changePasswordAction(
  _: unknown,
  formData: FormData,
): Promise<PasswordResult> {
  const user = await getUser()
  if (!user || !user.email) return { ok: false, error: 'Not signed in' }

  const parsed = ChangePasswordSchema.safeParse({
    current: String(formData.get('current') ?? ''),
    next: String(formData.get('next') ?? ''),
    confirm: String(formData.get('confirm') ?? ''),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }

  const supabase = await createClient()

  // Re-authenticate via the current password so we know the user actually owns this account.
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current,
  })
  if (signInErr) return { ok: false, error: 'Current password is incorrect.' }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: parsed.data.next,
  })
  if (updateErr) return { ok: false, error: updateErr.message }

  // Fire-and-forget security alert so the user has a paper trail.
  try {
    const h = await headers()
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      null
    const ua = h.get('user-agent') || null
    const device = ua ? parseDevice(ua) : null
    const rendered = renderPasswordChanged({
      email: user.email,
      changedAt: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      device,
      location: null,
      ipAddress: ip,
      securityUrl: marketingUrl('/settings/security'),
    })
    sendEmail({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    }).catch((err) => console.error('[password-changed] email failed:', err))
  } catch (err) {
    console.error('[password-changed] email prep failed:', err)
  }

  return { ok: true }
}

function parseDevice(ua: string): string {
  // Tiny UA summary — enough for "Safari · macOS"-style copy in the email.
  const browser = /Firefox\//.test(ua)
    ? 'Firefox'
    : /Edg\//.test(ua)
      ? 'Edge'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Unknown browser'
  const os = /Mac OS X|Macintosh/.test(ua)
    ? 'macOS'
    : /Windows/.test(ua)
      ? 'Windows'
      : /Linux/.test(ua)
        ? 'Linux'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : /Android/.test(ua)
            ? 'Android'
            : 'Unknown OS'
  return `${browser} · ${os}`
}
