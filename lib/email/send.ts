import 'server-only'
import { Resend } from 'resend'

let cached: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  cached ??= new Resend(key)
  return cached
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export type EmailOptions = {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

// Sends via Resend when configured; otherwise prints a boxed log so dev
// testing still surfaces the invite link without needing an email account.
export async function sendEmail(opts: EmailOptions): Promise<{ ok: true; provider: 'resend' | 'console' }> {
  const from = opts.from ?? process.env.RESEND_FROM_EMAIL ?? 'ShakeBase <hello@shakebase.co>'
  const resend = getResend()

  if (!resend) {
    console.log(
      [
        '',
        '┌──────────── email (console fallback) ────────────',
        `│ From:    ${from}`,
        `│ To:      ${opts.to}`,
        `│ Subject: ${opts.subject}`,
        '│',
        opts.text
          ? opts.text.split('\n').map((l) => `│ ${l}`).join('\n')
          : opts.html.replace(/<[^>]+>/g, '').split('\n').map((l) => `│ ${l}`).join('\n'),
        '└──────────────────────────────────────────────────',
        '',
      ].join('\n'),
    )
    return { ok: true, provider: 'console' }
  }

  await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  })
  return { ok: true, provider: 'resend' }
}
