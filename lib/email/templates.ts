// ShakeBase email templates — rendered HTML + plain-text pairs.
//
// All templates share the same visual system:
// - 560px max centered canvas on a warm-stone background
// - Amber-gold accent · Georgia italic display face · IBM Plex Mono kickers
// - Inline styles only (email-client safe), no external assets
// - A preheader for inbox preview + a text fallback for deliverability
//
// Add a new template: create a factory below that returns
// { subject, html, text, preheader } and export it.

// ─── brand ───────────────────────────────────────────────────────────

export const BRAND = {
  name: 'ShakeBase',
  domain: 'shakebase.co',
  from: 'ShakeBase <hello@shakebase.co>',
  securityFrom: 'ShakeBase <security@shakebase.co>',
  billingFrom: 'ShakeBase <billing@shakebase.co>',
  replyTo: 'hello@shakebase.co',
  address: 'ShakeBase · 14 rue de la Cerise, 75011 Paris',
}

export type Rendered = {
  subject: string
  html: string
  text: string
  preheader: string
}

// ─── escape helpers ──────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
const e = esc // shorthand for inline interpolation

// ─── shared shell primitives ─────────────────────────────────────────

const emailShell = (bodyInner: string, preheader: string): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="format-detection" content="telephone=no, address=no, email=no, date=no, url=no" />
<title>${esc(BRAND.name)}</title>
<style>
  /* Stop Apple Mail / Outlook / Gmail from auto-linkifying plain text
     (phone numbers, addresses, emails, URLs) with their default blue. */
  a[x-apple-data-detectors] {
    color: inherit !important;
    text-decoration: none !important;
    font-size: inherit !important;
    font-family: inherit !important;
    font-weight: inherit !important;
    line-height: inherit !important;
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f3f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141414;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;">${esc(preheader)}</div>
  <div style="background:#f3f1ea;padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;">
${bodyInner}
    </div>
  </div>
</body>
</html>`

// Gmail (web + Android) strips display:flex and gap. Use tables for any
// horizontal grouping — widely supported, predictable spacing.
const header = (env?: string): string => `      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="padding:4px 8px 20px;">
        <tr>
          <td width="20" style="vertical-align:middle;padding-right:12px;">
            <div style="width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#e8c898,#c49155 60%,#8a5f2e);box-shadow:inset 0 -2px 3px rgba(0,0,0,0.18);"></div>
          </td>
          <td style="vertical-align:middle;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:20px;letter-spacing:-0.01em;color:#141414;line-height:1;">${esc(BRAND.name)}</td>
          ${env ? `<td style="vertical-align:middle;text-align:right;font-size:10px;letter-spacing:0.1em;color:#9a9a9a;text-transform:uppercase;font-family:ui-monospace,'SF Mono',Menlo,monospace;">${esc(env)}</td>` : ''}
        </tr>
      </table>`

const card = (inner: string): string => `      <div style="background:#ffffff;border:1px solid rgba(10,10,10,0.08);border-radius:18px;padding:36px 36px 32px;">
${inner}
      </div>`

const footer = (): string => `      <div style="padding:22px 12px 0;color:#9a9a9a;font-size:12px;line-height:1.6;">
        <div style="margin-bottom:10px;">
          <a href="https://${BRAND.domain}" style="color:#6e6e6e;text-decoration:none;margin-right:14px;">${BRAND.domain}</a>
          <a href="https://${BRAND.domain}/settings/notifications" style="color:#6e6e6e;text-decoration:none;margin-right:14px;">Notifications</a>
          <a href="https://${BRAND.domain}/help" style="color:#6e6e6e;text-decoration:none;">Help</a>
        </div>
        <div>${esc(BRAND.address)}</div>
      </div>`

const button = (
  label: string,
  href: string,
  variant: 'primary' | 'secondary' = 'primary',
): string => {
  const bg = variant === 'primary' ? '#141414' : '#ffffff'
  const fg = variant === 'primary' ? '#ffffff' : '#141414'
  const border = variant === 'primary' ? '#141414' : 'rgba(10,10,10,0.15)'
  return `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:${fg};text-decoration:none;padding:13px 22px;border-radius:10px;border:1px solid ${border};font-size:14px;font-weight:500;letter-spacing:0.01em;">${esc(label)}</a>`
}

const h1 = (innerHtml: string): string =>
  `        <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:32px;line-height:1.15;letter-spacing:-0.01em;color:#141414;">${innerHtml}</h1>`

const p = (innerHtml: string, extra = ''): string =>
  `        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3a3a3a;${extra}">${innerHtml}</p>`

const hairline = (): string =>
  `        <div style="height:1px;background:rgba(10,10,10,0.08);margin:26px 0;"></div>`

const kicker = (text: string): string =>
  `        <div style="font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c49155;margin-bottom:14px;">${esc(text)}</div>`

// ─── 1. Team invitation ──────────────────────────────────────────────

export type InvitationEmail = {
  inviterName: string
  inviterEmail: string
  workspaceName: string
  role: string
  acceptUrl: string
  expiresIn?: string
}

export function renderInvitation(i: InvitationEmail): Rendered {
  const expires = i.expiresIn ?? '7 days'
  const initial = (i.inviterName.trim()[0] ?? '?').toUpperCase()
  const body = card(`
${kicker('Workspace invitation')}
${h1(`${e(i.inviterName)} invited you to join <em style="font-style:italic;">${e(i.workspaceName)}</em>`)}
${p(`You've been added to <strong style="color:#141414;font-weight:500;">${e(i.workspaceName)}</strong> as a <strong style="color:#141414;font-weight:500;">${e(i.role)}</strong>. ${e(BRAND.name)} is a shared cocktail database — recipes, costs, stock, and the people who make them.`)}

        <div style="margin:28px 0 8px;">${button('Accept invitation', i.acceptUrl)}</div>
        <div style="font-size:12px;color:#9a9a9a;margin-top:14px;">This invitation expires in ${e(expires)}. If you didn't expect this, you can ignore this email.</div>

${hairline()}

        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#faf8f1;border-radius:12px;border:1px solid rgba(10,10,10,0.05);">
          <tr>
            <td width="36" style="padding:14px 0 14px 16px;vertical-align:middle;">
              <div style="width:36px;height:36px;border-radius:50%;background:#e8c898;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;color:#8a5f2e;line-height:36px;text-align:center;">${e(initial)}</div>
            </td>
            <td style="padding:14px 16px 14px 14px;vertical-align:middle;">
              <div style="font-size:13px;color:#141414;font-weight:500;line-height:1.4;">${e(i.inviterName)}</div>
              <a href="mailto:${e(i.inviterEmail)}" style="font-size:12px;color:#8a5f2e;text-decoration:none;border-bottom:1px solid rgba(138,95,46,0.25);line-height:1.4;">${e(i.inviterEmail)}</a>
            </td>
          </tr>
        </table>

        <div style="font-size:12px;color:#9a9a9a;margin-top:18px;line-height:1.6;">Trouble with the button? Paste this link into your browser:<br/>
          <a href="${e(i.acceptUrl)}" style="color:#6e6e6e;text-decoration:none;border-bottom:1px solid rgba(10,10,10,0.15);word-break:break-all;">${e(i.acceptUrl)}</a>
        </div>`)

  const preheader = `Join ${BRAND.name} — ${i.inviterName} invited you to ${i.workspaceName}`
  const html = emailShell(`${header('Invitation')}\n${body}\n${footer()}`, preheader)

  const text = [
    `${i.inviterName} invited you to ${i.workspaceName} on ${BRAND.name}.`,
    `You've been added as a ${i.role}.`,
    ``,
    `Accept: ${i.acceptUrl}`,
    ``,
    `This link expires in ${expires}. If you didn't expect this, ignore this email.`,
  ].join('\n')

  return {
    subject: `${i.inviterName} invited you to ${i.workspaceName} on ${BRAND.name}`,
    html,
    text,
    preheader,
  }
}

// ─── 2. Welcome / onboarding ─────────────────────────────────────────

export type WelcomeEmail = {
  firstName: string
  workspaceUrl: string
  newCocktailUrl: string
  ingredientsUrl: string
  inviteTeamUrl: string
}

export function renderWelcome(w: WelcomeEmail): Rendered {
  const steps: [string, string, string][] = [
    ['Add your first cocktail', 'Import from a menu or start blank.', w.newCocktailUrl],
    ['Stock a few ingredients', 'Track inventory and cost per pour.', w.ingredientsUrl],
    ['Invite your team', 'Bartenders, managers, and owners.', w.inviteTeamUrl],
  ]
  const checklist = steps
    .map(
      ([t, s, href], i) => `
        <a href="${e(href)}" style="display:block;padding:16px 18px;margin-bottom:10px;background:#ffffff;border:1px solid rgba(10,10,10,0.08);border-radius:12px;text-decoration:none;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:28px;height:28px;border-radius:50%;background:#faf3e6;color:#8a5f2e;font-family:ui-monospace,Menlo,monospace;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${String(i + 1).padStart(2, '0')}</div>
            <div style="flex:1;">
              <div style="font-size:14px;color:#141414;font-weight:500;margin-bottom:2px;">${e(t)}</div>
              <div style="font-size:12.5px;color:#6e6e6e;">${e(s)}</div>
            </div>
            <div style="color:#c49155;font-size:18px;">→</div>
          </div>
        </a>`,
    )
    .join('')

  const body = card(`
${kicker(`Welcome to ${BRAND.name}`)}
${h1(`A quieter place for your recipes, ${e(w.firstName)}.`)}
${p(`Your workspace is ready. ${e(BRAND.name)} is built for bar teams who want one trustworthy source for every recipe, cost, and pour — no more scattered notebooks and Google Docs.`)}
${p(`Here's a three-step way in:`)}

        <div style="margin:22px 0 6px;">${checklist}</div>

${hairline()}

${p(`If you get stuck, reply to this email — a real person will answer. We usually get back within a few hours.`, 'color:#6e6e6e;font-size:13.5px;')}

        <div style="margin-top:22px;">${button('Open your workspace', w.workspaceUrl, 'secondary')}</div>`)

  const preheader = `Welcome to ${BRAND.name}. Here's how to start.`
  const html = emailShell(`${header()}\n${body}\n${footer()}`, preheader)

  const text = [
    `Welcome to ${BRAND.name}, ${w.firstName}.`,
    ``,
    `Your workspace is ready. Three ways to start:`,
    ...steps.map(([t, s, href]) => `- ${t} — ${s}\n  ${href}`),
    ``,
    `Open your workspace: ${w.workspaceUrl}`,
  ].join('\n')

  return {
    subject: `Welcome to ${BRAND.name}, ${w.firstName}`,
    html,
    text,
    preheader,
  }
}

// ─── 3. Password reset ───────────────────────────────────────────────

export type PasswordResetEmail = {
  email: string
  resetUrl: string
  expiresInMinutes?: number
}

export function renderPasswordReset(pr: PasswordResetEmail): Rendered {
  const mins = pr.expiresInMinutes ?? 60
  const body = card(`
${kicker('Reset your password')}
${h1(`Let's get you back in.`)}
${p(`We received a request to reset the password for <strong style="color:#141414;font-weight:500;">${e(pr.email)}</strong>. Click below to choose a new one.`)}

        <div style="margin:28px 0 8px;">${button('Reset password', pr.resetUrl)}</div>
        <div style="font-size:12px;color:#9a9a9a;margin-top:14px;">This link expires in ${mins} minutes.</div>

${hairline()}

        <div style="padding:14px 16px;background:#faf8f1;border-radius:12px;border:1px solid rgba(10,10,10,0.05);font-size:12.5px;color:#6e6e6e;line-height:1.65;">
          <strong style="color:#141414;font-weight:500;">Didn't request this?</strong> You can safely ignore this email — your password won't change. If you're seeing repeated resets you didn't ask for, reply to this message and we'll take a look.
        </div>

        <div style="font-size:12px;color:#9a9a9a;margin-top:18px;line-height:1.6;">Link not working? Paste this into your browser:<br/>
          <a href="${e(pr.resetUrl)}" style="color:#6e6e6e;text-decoration:none;border-bottom:1px solid rgba(10,10,10,0.15);word-break:break-all;">${e(pr.resetUrl)}</a>
        </div>`)

  const preheader = `A one-time link to choose a new password. Expires in ${mins} minutes.`
  const html = emailShell(`${header()}\n${body}\n${footer()}`, preheader)
  const text = [
    `Reset your ${BRAND.name} password.`,
    ``,
    `Open: ${pr.resetUrl}`,
    ``,
    `This link expires in ${mins} minutes. Didn't request it? Ignore this email.`,
  ].join('\n')

  return {
    subject: `Reset your ${BRAND.name} password`,
    html,
    text,
    preheader,
  }
}

// ─── 4. Password changed ─────────────────────────────────────────────

export type PasswordChangedEmail = {
  email: string
  changedAt: string
  device?: string | null
  location?: string | null
  ipAddress?: string | null
  securityUrl: string
}

export function renderPasswordChanged(pc: PasswordChangedEmail): Rendered {
  const device = pc.device ?? 'Unknown device'
  const location = pc.location ?? 'Unknown'
  const ip = pc.ipAddress ?? '—'
  const body = card(`
${kicker('Security update')}
${h1(`Your password was changed.`)}
${p(`The password for <strong style="color:#141414;font-weight:500;">${e(pc.email)}</strong> was updated on <strong style="color:#141414;font-weight:500;">${e(pc.changedAt)}</strong>.`)}

        <div style="margin:22px 0;padding:16px 18px;background:#faf8f1;border:1px solid rgba(10,10,10,0.05);border-radius:12px;">
          <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 18px;font-size:13px;">
            <div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">Device</div>
            <div style="color:#141414;">${e(device)}</div>
            <div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">Location</div>
            <div style="color:#141414;">${e(location)}</div>
            <div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">IP address</div>
            <div style="color:#141414;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;">${e(ip)}</div>
          </div>
        </div>

${p(`If this was you, no action needed.`)}
${p(`If you don't recognise this activity, secure your account now.`, 'color:#b24040;')}

        <div style="margin:22px 0 4px;">${button('Secure my account', pc.securityUrl)}</div>`)

  const preheader = `Confirmation that your password was updated.`
  const html = emailShell(`${header()}\n${body}\n${footer()}`, preheader)
  const text = [
    `Your ${BRAND.name} password was changed.`,
    `Account: ${pc.email}`,
    `When: ${pc.changedAt}`,
    `Device: ${device} · Location: ${location} · IP: ${ip}`,
    ``,
    `If this wasn't you, secure your account: ${pc.securityUrl}`,
  ].join('\n')

  return {
    subject: `Your ${BRAND.name} password was changed`,
    html,
    text,
    preheader,
  }
}

// ─── 5. Weekly digest ────────────────────────────────────────────────

export type WeeklyDigestEmail = {
  workspaceName: string
  weekOf: string
  dashboardUrl: string
  stats: { newCocktails: number; newCreators: number; recipesViewed: number }
  cocktails: { name: string; spec: string; author: string; url: string }[]
}

export function renderWeeklyDigest(d: WeeklyDigestEmail): Rendered {
  const statPairs: [string, string][] = [
    [String(d.stats.newCocktails), 'new cocktails'],
    [String(d.stats.newCreators), 'new creators'],
    [String(d.stats.recipesViewed), 'recipes viewed'],
  ]
  const statsHtml = statPairs
    .map(
      ([n, l]) => `
            <div style="flex:1;padding:18px 14px;background:#faf8f1;border:1px solid rgba(10,10,10,0.05);border-radius:12px;text-align:center;">
              <div style="font-family:Georgia,serif;font-style:italic;font-size:30px;color:#141414;line-height:1;">${e(n)}</div>
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#9a9a9a;margin-top:8px;">${e(l)}</div>
            </div>`,
    )
    .join('')

  const cocktailsHtml = d.cocktails
    .map(
      (c) => `
          <a href="${e(c.url)}" style="display:block;padding:16px 2px;border-bottom:1px solid rgba(10,10,10,0.06);text-decoration:none;">
            <div style="display:flex;gap:14px;align-items:center;">
              <div style="width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#e8c898,#c49155 65%,#8a5f2e);flex-shrink:0;"></div>
              <div style="flex:1;min-width:0;">
                <div style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#141414;margin-bottom:3px;">${e(c.name)}</div>
                <div style="font-size:12.5px;color:#6e6e6e;">${e(c.spec)}</div>
              </div>
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;color:#9a9a9a;text-align:right;flex-shrink:0;">${e(c.author)}</div>
            </div>
          </a>`,
    )
    .join('')

  const body = card(`
${kicker(`Week of ${d.weekOf}`)}
${h1(`This week in your bar.`)}
${p(`A quiet summary of what's moved in <strong style="color:#141414;font-weight:500;">${e(d.workspaceName)}</strong>. No action required — just a look.`)}

        <div style="display:flex;gap:10px;margin:24px 0 10px;">${statsHtml}</div>

${hairline()}

        <div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:#9a9a9a;margin-bottom:6px;">New cocktails</div>
        <div>${cocktailsHtml || '<div style="padding:20px 0;color:#9a9a9a;font-size:13px;">Nothing new this week.</div>'}</div>

        <div style="margin:26px 0 4px;">${button('Open dashboard', d.dashboardUrl, 'secondary')}</div>`)

  const preheader = `A quiet summary of what moved this week.`
  const html = emailShell(`${header()}\n${body}\n${footer()}`, preheader)
  const text = [
    `This week in ${d.workspaceName} — ${d.weekOf}`,
    ``,
    `${d.stats.newCocktails} new cocktails · ${d.stats.newCreators} new creators · ${d.stats.recipesViewed} recipes viewed`,
    ``,
    ...(d.cocktails.length
      ? d.cocktails.map((c) => `- ${c.name} — ${c.spec} · by ${c.author}\n  ${c.url}`)
      : ['Nothing new this week.']),
    ``,
    `Dashboard: ${d.dashboardUrl}`,
  ].join('\n')

  return {
    subject: `Your ${BRAND.name} week — ${d.weekOf}`,
    html,
    text,
    preheader,
  }
}

// ─── 6. Submission approved ──────────────────────────────────────────

export type SubmissionApprovedEmail = {
  firstName: string
  workspaceName: string
  cocktailName: string
  shortSpec: string
  category: string
  glassware: string
  approvedAt: string
  reviewerName: string
  reviewerNote?: string | null
  viewUrl: string
  shareUrl: string
}

export function renderSubmissionApproved(s: SubmissionApprovedEmail): Rendered {
  const reviewerNote = s.reviewerNote
    ? `
        <div style="padding:16px 18px;border-left:3px solid #c49155;background:#ffffff;font-size:14px;color:#3a3a3a;line-height:1.6;font-style:italic;">
          "${e(s.reviewerNote)}"
          <div style="margin-top:8px;font-style:normal;font-size:12px;color:#9a9a9a;">— ${e(s.reviewerName)}</div>
        </div>`
    : ''

  const body = card(`
${kicker('Submission approved')}
${h1(`<em style="font-style:italic;">${e(s.cocktailName)}</em> is in the book.`)}
${p(`Nice one, ${e(s.firstName)}. <strong style="color:#141414;font-weight:500;">${e(s.reviewerName)}</strong> approved your submission on <strong style="color:#141414;font-weight:500;">${e(s.approvedAt)}</strong>. It's now visible to everyone in ${e(s.workspaceName)}.`)}

        <div style="margin:24px 0;padding:22px;background:#faf8f1;border:1px solid rgba(10,10,10,0.05);border-radius:14px;">
          <div style="display:flex;gap:16px;align-items:center;">
            <div style="width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#e8c898,#c49155 60%,#8a5f2e);flex-shrink:0;box-shadow:inset 0 -3px 5px rgba(0,0,0,0.18);"></div>
            <div style="flex:1;min-width:0;">
              <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#141414;margin-bottom:4px;">${e(s.cocktailName)}</div>
              <div style="font-size:13px;color:#6e6e6e;margin-bottom:6px;">${e(s.shortSpec)}</div>
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:0.06em;color:#8a5f2e;text-transform:uppercase;">${e(s.category)} · ${e(s.glassware)}</div>
            </div>
          </div>
        </div>
${reviewerNote}

        <div style="margin:24px 0 4px;display:flex;gap:10px;flex-wrap:wrap;">
          ${button('View recipe', s.viewUrl)}
          ${button('Share', s.shareUrl, 'secondary')}
        </div>`)

  const preheader = `Nice one — your cocktail was approved.`
  const html = emailShell(`${header()}\n${body}\n${footer()}`, preheader)
  const text = [
    `${s.cocktailName} is now in ${s.workspaceName}.`,
    `Approved by ${s.reviewerName} on ${s.approvedAt}.`,
    s.reviewerNote ? `\n"${s.reviewerNote}"\n— ${s.reviewerName}` : '',
    ``,
    `View: ${s.viewUrl}`,
  ].join('\n')

  return {
    subject: `Approved: ${s.cocktailName} is now in ${s.workspaceName}`,
    html,
    text,
    preheader,
  }
}

// ─── 7. Mention / comment ────────────────────────────────────────────

export type MentionEmail = {
  mentionerName: string
  mentionerInitial: string
  timeAgo: string
  cocktailName: string
  cocktailUrl: string
  commentText: string
  commentId: string
  parent?: {
    author: string
    initial: string
    time: string
    text: string
  } | null
  replyUrl: string
  notificationsUrl: string
}

export function renderMention(m: MentionEmail): Rendered {
  const parent = m.parent
    ? `
          <div style="padding:16px 20px;border-bottom:1px solid rgba(10,10,10,0.06);">
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
              <div style="width:24px;height:24px;border-radius:50%;background:#ece6d6;font-family:Georgia,serif;font-style:italic;font-size:11px;color:#6e6e6e;display:flex;align-items:center;justify-content:center;">${e(m.parent.initial)}</div>
              <div style="font-size:13px;color:#6e6e6e;">${e(m.parent.author)}</div>
              <div style="font-size:11px;color:#9a9a9a;">${e(m.parent.time)}</div>
            </div>
            <div style="font-size:13.5px;color:#6e6e6e;line-height:1.55;padding-left:34px;">${e(m.parent.text)}</div>
          </div>`
    : ''

  const body = card(`
${kicker('New mention')}
${h1(`${e(m.mentionerName)} mentioned you.`)}
${p(`On <a href="${e(m.cocktailUrl)}" style="color:#8a5f2e;text-decoration:none;border-bottom:1px solid rgba(138,95,46,0.3);"><em style="font-style:italic;">${e(m.cocktailName)}</em></a> — ${e(m.timeAgo)}.`)}

        <div style="margin:24px 0;background:#faf8f1;border:1px solid rgba(10,10,10,0.05);border-radius:14px;overflow:hidden;">
${parent}
          <div style="padding:16px 20px;background:#ffffff;">
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
              <div style="width:28px;height:28px;border-radius:50%;background:#e8c898;font-family:Georgia,serif;font-style:italic;font-size:12px;color:#8a5f2e;display:flex;align-items:center;justify-content:center;">${e(m.mentionerInitial)}</div>
              <div style="font-size:13.5px;color:#141414;font-weight:500;">${e(m.mentionerName)}</div>
              <div style="font-size:11px;color:#9a9a9a;">${e(m.timeAgo)}</div>
            </div>
            <div style="font-size:14.5px;color:#141414;line-height:1.6;padding-left:38px;">${e(m.commentText)}</div>
          </div>
        </div>

        <div style="margin:20px 0 4px;">${button('Reply in thread', m.replyUrl)}</div>

${hairline()}

${p(`You're getting this because you were @-mentioned. <a href="${e(m.notificationsUrl)}" style="color:#6e6e6e;">Adjust notifications →</a>`, 'color:#9a9a9a;font-size:12.5px;')}`)

  const preheader = `${m.mentionerName}: ${m.commentText.slice(0, 140)}`
  const html = emailShell(`${header()}\n${body}\n${footer()}`, preheader)
  const text = [
    `${m.mentionerName} mentioned you on ${m.cocktailName} — ${m.timeAgo}.`,
    ``,
    m.parent ? `> ${m.parent.author}: ${m.parent.text}\n` : '',
    `${m.mentionerName}: ${m.commentText}`,
    ``,
    `Reply: ${m.replyUrl}`,
  ].join('\n')

  return {
    subject: `${m.mentionerName} mentioned you on ${m.cocktailName}`,
    html,
    text,
    preheader,
  }
}

// ─── 8. Billing receipt ──────────────────────────────────────────────

export type BillingReceiptEmail = {
  workspaceName: string
  invoiceNumber: string
  chargedAt: string
  totalAmount: string
  cardLast4: string
  seatCount: number
  billingPeriod: string
  planAmount: string
  proratedDesc: string
  proratedAmount: string
  taxAmount: string
  vatRate: string
  billingCountry: string
  nextRenewal: string
  invoicePdfUrl: string
  billingSettingsUrl: string
}

export function renderBillingReceipt(r: BillingReceiptEmail): Rendered {
  const lineItem = (label: string, sub: string, amount: string) => `
          <div style="display:flex;align-items:flex-start;padding:14px 0;border-bottom:1px solid rgba(10,10,10,0.06);">
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;color:#141414;margin-bottom:3px;">${e(label)}</div>
              <div style="font-size:12px;color:#9a9a9a;">${e(sub)}</div>
            </div>
            <div style="font-family:ui-monospace,Menlo,monospace;font-size:13.5px;color:#141414;padding-left:16px;">${e(amount)}</div>
          </div>`

  const body = card(`
${kicker(`Receipt · ${r.invoiceNumber}`)}
${h1(`Thanks — we've got it.`)}
${p(`Your ${e(BRAND.name)} subscription for <strong style="color:#141414;font-weight:500;">${e(r.workspaceName)}</strong> renewed on <strong style="color:#141414;font-weight:500;">${e(r.chargedAt)}</strong>.`)}

        <div style="margin:24px 0 16px;padding:22px;background:#faf8f1;border:1px solid rgba(10,10,10,0.05);border-radius:14px;">
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px;">
            <div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;color:#9a9a9a;">Total charged</div>
            <div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:0.06em;color:#3a7f5a;">Paid</div>
          </div>
          <div style="font-family:Georgia,serif;font-style:italic;font-size:42px;color:#141414;line-height:1;letter-spacing:-0.01em;">${e(r.totalAmount)}</div>
          <div style="font-size:12.5px;color:#6e6e6e;margin-top:6px;">Charged to Visa ending in ${e(r.cardLast4)}</div>
        </div>

        <div style="margin-top:18px;">
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:#9a9a9a;margin-bottom:4px;">Line items</div>
          ${lineItem(`${BRAND.name} · Team plan`, `${r.seatCount} seats · ${r.billingPeriod}`, r.planAmount)}
          ${lineItem('Prorated adjustments', r.proratedDesc, r.proratedAmount)}
          ${lineItem(`Tax (VAT ${r.vatRate})`, r.billingCountry, r.taxAmount)}
        </div>

        <div style="display:flex;justify-content:space-between;padding:16px 0 4px;margin-top:4px;border-top:1px solid rgba(10,10,10,0.12);">
          <div style="font-size:14px;color:#141414;font-weight:500;">Total</div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:15px;color:#141414;font-weight:500;">${e(r.totalAmount)}</div>
        </div>

        <div style="margin:28px 0 4px;display:flex;gap:10px;flex-wrap:wrap;">
          ${button('Download PDF receipt', r.invoicePdfUrl)}
          ${button('Billing settings', r.billingSettingsUrl, 'secondary')}
        </div>

${hairline()}

${p(`Next renewal on <strong style="color:#141414;font-weight:500;">${e(r.nextRenewal)}</strong>. Cancel anytime from billing settings — we'll pro-rate the unused portion.`, 'color:#6e6e6e;font-size:13px;')}`)

  const preheader = `Your monthly ${BRAND.name} subscription receipt.`
  const html = emailShell(`${header()}\n${body}\n${footer()}`, preheader)
  const text = [
    `Receipt ${r.invoiceNumber} — ${BRAND.name}`,
    ``,
    `Workspace: ${r.workspaceName}`,
    `Charged: ${r.chargedAt}`,
    `Total: ${r.totalAmount} (Visa •••• ${r.cardLast4})`,
    ``,
    `${BRAND.name} Team plan · ${r.seatCount} seats · ${r.billingPeriod} → ${r.planAmount}`,
    `Prorated adjustments (${r.proratedDesc}) → ${r.proratedAmount}`,
    `Tax VAT ${r.vatRate} (${r.billingCountry}) → ${r.taxAmount}`,
    ``,
    `Next renewal: ${r.nextRenewal}`,
    `PDF: ${r.invoicePdfUrl}`,
  ].join('\n')

  return {
    subject: `Receipt ${r.invoiceNumber} from ${BRAND.name} — ${r.totalAmount}`,
    html,
    text,
    preheader,
  }
}

// ─── Back-compat: previous invitation helpers ────────────────────────

type InviteEmail = {
  workspaceName: string
  inviterName: string
  role: 'owner' | 'editor' | 'viewer'
  acceptUrl: string
  expiresIn: string
}

/** @deprecated Use renderInvitation() which returns {subject, html, text, preheader}. */
export function inviteEmailHtml(i: InviteEmail): string {
  return renderInvitation({
    workspaceName: i.workspaceName,
    inviterName: i.inviterName,
    inviterEmail: '',
    role: i.role,
    acceptUrl: i.acceptUrl,
    expiresIn: i.expiresIn,
  }).html
}

/** @deprecated Use renderInvitation() which returns {subject, html, text, preheader}. */
export function inviteEmailText(i: InviteEmail): string {
  return renderInvitation({
    workspaceName: i.workspaceName,
    inviterName: i.inviterName,
    inviterEmail: '',
    role: i.role,
    acceptUrl: i.acceptUrl,
    expiresIn: i.expiresIn,
  }).text
}

// ─── Preview registry (used by the /admin/emails route) ──────────────

export type TemplatePreview = {
  id: string
  label: string
  kind: 'Transactional' | 'Onboarding' | 'Security' | 'Digest' | 'Notification' | 'Billing'
  render: () => Rendered
}

export const TEMPLATE_PREVIEWS: TemplatePreview[] = [
  {
    id: 'invitation',
    label: 'Team invitation',
    kind: 'Transactional',
    render: () =>
      renderInvitation({
        inviterName: 'Maya Chen',
        inviterEmail: 'maya@rubra.mx',
        workspaceName: 'Rubra',
        role: 'editor',
        acceptUrl: 'https://shakebase.co/accept-invite?token=sample',
      }),
  },
  {
    id: 'welcome',
    label: 'Welcome',
    kind: 'Onboarding',
    render: () =>
      renderWelcome({
        firstName: 'Luca',
        workspaceUrl: 'https://rubra.shakebase.co/dashboard',
        newCocktailUrl: 'https://rubra.shakebase.co/cocktails/new',
        ingredientsUrl: 'https://rubra.shakebase.co/ingredients',
        inviteTeamUrl: 'https://rubra.shakebase.co/settings/team',
      }),
  },
  {
    id: 'password-reset',
    label: 'Password reset',
    kind: 'Security',
    render: () =>
      renderPasswordReset({
        email: 'pierre@shakebase.co',
        resetUrl: 'https://shakebase.co/reset?token=sample',
      }),
  },
  {
    id: 'password-changed',
    label: 'Password changed',
    kind: 'Security',
    render: () =>
      renderPasswordChanged({
        email: 'pierre@shakebase.co',
        changedAt: new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        device: 'Safari · macOS',
        location: 'Paris, FR',
        ipAddress: '82.64.12.9',
        securityUrl: 'https://shakebase.co/settings/security',
      }),
  },
  {
    id: 'weekly-digest',
    label: 'Weekly digest',
    kind: 'Digest',
    render: () =>
      renderWeeklyDigest({
        workspaceName: 'Rubra',
        weekOf: 'Apr 14 – 20',
        dashboardUrl: 'https://rubra.shakebase.co/dashboard',
        stats: { newCocktails: 12, newCreators: 4, recipesViewed: 38 },
        cocktails: [
          {
            name: 'Smoked Oaxacan',
            spec: 'Mezcal · Ancho · Pineapple',
            author: 'Maya Chen',
            url: 'https://rubra.shakebase.co/cocktails/smoked-oaxacan',
          },
          {
            name: 'Quiet Negroni',
            spec: 'Gin · Campari · Suze',
            author: 'Luca Ferri',
            url: 'https://rubra.shakebase.co/cocktails/quiet-negroni',
          },
        ],
      }),
  },
  {
    id: 'submission-approved',
    label: 'Submission approved',
    kind: 'Transactional',
    render: () =>
      renderSubmissionApproved({
        firstName: 'Luca',
        workspaceName: 'Rubra',
        cocktailName: 'Piña Traviesa',
        shortSpec: 'Tequila · Pineapple · Yellow Chartreuse',
        category: 'Old Fashioned',
        glassware: 'Rocks',
        approvedAt: 'April 21',
        reviewerName: 'Maya Chen',
        reviewerNote: 'Beautifully balanced. Made the menu cut.',
        viewUrl: 'https://rubra.shakebase.co/cocktails/pina-traviesa',
        shareUrl: 'https://rubra.shakebase.co/cocktails/pina-traviesa?share=1',
      }),
  },
  {
    id: 'mention',
    label: 'Mention / comment',
    kind: 'Notification',
    render: () =>
      renderMention({
        mentionerName: 'Maya Chen',
        mentionerInitial: 'M',
        timeAgo: '2 min ago',
        cocktailName: 'Piña Traviesa',
        cocktailUrl: 'https://rubra.shakebase.co/cocktails/pina-traviesa',
        commentText:
          '@luca can we batch this for Saturday? Thinking 2L with proportional Chartreuse.',
        commentId: '123',
        parent: {
          author: 'Luca Ferri',
          initial: 'L',
          time: 'yesterday',
          text: 'Final spec in — stirred over big cube.',
        },
        replyUrl:
          'https://rubra.shakebase.co/cocktails/pina-traviesa#c-123',
        notificationsUrl: 'https://rubra.shakebase.co/settings/notifications',
      }),
  },
  {
    id: 'billing-receipt',
    label: 'Monthly receipt',
    kind: 'Billing',
    render: () =>
      renderBillingReceipt({
        workspaceName: 'Rubra',
        invoiceNumber: 'SB-2026-04-00128',
        chargedAt: 'April 1, 2026',
        totalAmount: '$162.00',
        cardLast4: '4242',
        seatCount: 6,
        billingPeriod: 'Apr 1 – Apr 30',
        planAmount: '$150.00',
        proratedDesc: 'Seat added mid-cycle',
        proratedAmount: '$12.00',
        taxAmount: '$0.00',
        vatRate: '0%',
        billingCountry: 'FR',
        nextRenewal: 'May 1, 2026',
        invoicePdfUrl: 'https://shakebase.co/billing/invoices/sample.pdf',
        billingSettingsUrl: 'https://rubra.shakebase.co/settings/billing',
      }),
  },
]
