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

// If the configured from is just a bare email (no display name wrapped in
// `Name <email>` form), wrap it with the brand name so Gmail doesn't show
// only the local part (e.g. "hello" instead of "ShakeBase").
function ensureDisplayName(from: string): string {
  if (from.includes('<') && from.includes('>')) return from
  return `ShakeBase <${from.trim()}>`
}

// Sends via Resend when configured; otherwise prints a boxed log so dev
// testing still surfaces the invite link without needing an email account.
export async function sendEmail(opts: EmailOptions): Promise<{ ok: true; provider: 'resend' | 'console' }> {
  const rawFrom = opts.from ?? process.env.RESEND_FROM_EMAIL ?? 'ShakeBase <hello@shakebase.co>'
  const from = ensureDisplayName(rawFrom)
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
