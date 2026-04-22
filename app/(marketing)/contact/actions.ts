'use server'

import { z } from 'zod'
import { sendEmail } from '@/lib/email/send'
import { clientIp, rateLimit, rateLimitErrorMessage } from '@/lib/rate-limit'

export type ContactResult =
  | { ok: true; ticket: string; topic: string; firstName: string }
  | { ok: false; error: string }

const Schema = z.object({
  first: z.string().trim().min(1, 'First name required'),
  last: z.string().trim().min(1, 'Last name required'),
  email: z.string().trim().email('Valid email required'),
  company: z.string().trim().max(200).optional().or(z.literal('')),
  topic: z.enum(['sales', 'demo', 'support', 'security', 'press', 'partnership']),
  role: z.string().trim().max(80).optional().or(z.literal('')),
  size: z.string().trim().max(80).optional().or(z.literal('')),
  message: z.string().trim().min(4, 'Tell us a bit more').max(4000),
  urgent: z.string().optional(),
  trial: z.string().optional(),
  nda: z.string().optional(),
})

export async function submitContactAction(
  _: unknown,
  formData: FormData,
): Promise<ContactResult> {
  // 3 submissions per IP per hour — absorbs honest retries, blocks spam.
  const ip = await clientIp()
  const rl = await rateLimit({
    key: `contact:${ip}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok) {
    return { ok: false, error: rateLimitErrorMessage(rl.retryAfter) }
  }

  const parsed = Schema.safeParse({
    first: formData.get('first') ?? '',
    last: formData.get('last') ?? '',
    email: formData.get('email') ?? '',
    company: formData.get('company') ?? '',
    topic: formData.get('topic') ?? 'sales',
    role: formData.get('role') ?? '',
    size: formData.get('size') ?? '',
    message: formData.get('message') ?? '',
    urgent: formData.get('urgent') ?? undefined,
    trial: formData.get('trial') ?? undefined,
    nda: formData.get('nda') ?? undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }
  }

  const d = parsed.data
  const ticket = 'SB-' + String(Math.floor(Math.random() * 9000) + 1000)

  const inbox =
    process.env.CONTACT_INBOX_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    'hello@shakebase.co'

  const flags = [
    d.urgent ? 'URGENT' : null,
    d.trial ? 'wants trial' : null,
    d.nda ? 'needs NDA' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const subject = `[${ticket}] ${d.topic} — ${d.first} ${d.last}${flags ? ` (${flags})` : ''}`

  const text = [
    `From: ${d.first} ${d.last} <${d.email}>`,
    d.company ? `Company: ${d.company}` : null,
    d.role ? `Role: ${d.role}` : null,
    d.size ? `Team size: ${d.size}` : null,
    `Topic: ${d.topic}`,
    flags ? `Flags: ${flags}` : null,
    '',
    d.message,
    '',
    `— submitted via /contact · ticket ${ticket}`,
  ]
    .filter(Boolean)
    .join('\n')

  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const html = `<div style="font-family: system-ui, sans-serif; font-size: 14px; color: #1a1a1a;">
  <p><strong>${esc(d.first)} ${esc(d.last)}</strong> &lt;${esc(d.email)}&gt;</p>
  <p>
    ${d.company ? `Company: <strong>${esc(d.company)}</strong><br/>` : ''}
    ${d.role ? `Role: ${esc(d.role)}<br/>` : ''}
    ${d.size ? `Team size: ${esc(d.size)}<br/>` : ''}
    Topic: <strong>${esc(d.topic)}</strong>
    ${flags ? `<br/>Flags: ${esc(flags)}` : ''}
  </p>
  <hr style="border:0;border-top:1px solid #eee;margin:16px 0;"/>
  <pre style="white-space:pre-wrap;font:inherit;">${esc(d.message)}</pre>
  <hr style="border:0;border-top:1px solid #eee;margin:16px 0;"/>
  <p style="color:#888;font-size:12px;">Ticket ${esc(ticket)} · submitted via /contact</p>
</div>`

  try {
    await sendEmail({ to: inbox, subject, html, text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email delivery failed'
    console.error('[contact] send failed:', err)
    return { ok: false, error: message }
  }

  return { ok: true, ticket, topic: d.topic, firstName: d.first }
}
