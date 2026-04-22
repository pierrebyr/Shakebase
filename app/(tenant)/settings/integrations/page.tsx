import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { stripeConfigured } from '@/lib/stripe/client'
import { emailConfigured } from '@/lib/email/send'
import { Icon, type IconName } from '@/components/icons'

type Status = 'connected' | 'available' | 'planned'

type Integration = {
  name: string
  blurb: string
  icon: IconName
  status: Status
  cta?: { href: string; label: string }
  detail?: string
}

export default async function IntegrationsPage() {
  const user = await requireUser()
  const workspace = await getCurrentWorkspace()
  if (workspace.owner_user_id !== user.id) redirect('/settings')

  const stripeOn = stripeConfigured()
  const emailOn = emailConfigured()

  const core: Integration[] = [
    {
      name: 'Supabase',
      blurb: 'Database, auth, storage — powers your workspace data and images.',
      icon: 'beaker',
      status: 'connected',
      detail: 'Cocktails, creators, products, images, sessions',
    },
    {
      name: 'Stripe',
      blurb: 'Subscription billing and the customer portal for your workspace plan.',
      icon: 'card',
      status: stripeOn ? 'connected' : 'planned',
      cta: stripeOn ? { href: '/settings/billing', label: 'Manage billing' } : undefined,
      detail: stripeOn
        ? `Plan: Studio · ${workspace.subscription_status}`
        : 'Dev mode — Stripe not configured locally',
    },
    {
      name: 'Resend',
      blurb: 'Transactional email for invites, password resets and sign-in alerts.',
      icon: 'share',
      status: emailOn ? 'connected' : 'planned',
      detail: emailOn
        ? 'Sending from hello@shakebase.co'
        : 'Dev mode — emails land in server console',
    },
  ]

  const available: Integration[] = [
    {
      name: 'Slack',
      blurb: 'Post spec approvals, menu changes and new-creator alerts to a channel.',
      icon: 'bell',
      status: 'available',
    },
    {
      name: 'Zapier',
      blurb: 'Wire ShakeBase up to the 6,000+ apps Zapier supports. Useful for feed-to-PDF, CRM sync, etc.',
      icon: 'plug',
      status: 'available',
    },
    {
      name: 'Google Sheets',
      blurb: 'Keep a live menu sheet in sync — helpful for Events and PR teams.',
      icon: 'file',
      status: 'available',
    },
  ]

  const pos: Integration[] = [
    {
      name: 'Square',
      blurb: 'Sync sell-through, 86&rsquo;d items, and drink velocity straight into Analytics.',
      icon: 'analytics',
      status: 'planned',
    },
    {
      name: 'Lightspeed',
      blurb: 'Per-venue POS link for groups running multiple bars on one workspace.',
      icon: 'analytics',
      status: 'planned',
    },
    {
      name: 'Toast',
      blurb: 'North-American operators — drink-level sales data rolls up into creator payouts.',
      icon: 'analytics',
      status: 'planned',
    },
  ]

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">Data</div>
        <h1 className="page-title">Integrations.</h1>
        <p className="page-sub">
          Connect {workspace.name} to the tools your bar already runs on. POS and messaging are
          rolling out through 2026 — let us know what to prioritise.
        </p>
      </div>

      <Section kicker="Core" title="Connected services">
        <Grid>
          {core.map((i) => (
            <Card key={i.name} integration={i} />
          ))}
        </Grid>
      </Section>

      <Section kicker="Messaging & workflow" title="Available add-ons">
        <Grid>
          {available.map((i) => (
            <Card key={i.name} integration={i} />
          ))}
        </Grid>
      </Section>

      <Section kicker="POS & sales" title="Coming soon">
        <Grid>
          {pos.map((i) => (
            <Card key={i.name} integration={i} />
          ))}
        </Grid>
      </Section>

      <div
        className="card card-pad"
        style={{
          padding: 22,
          background: 'var(--bg-sunken)',
          border: '1px dashed var(--line-1)',
          boxShadow: 'none',
          marginTop: 24,
        }}
      >
        <div className="panel-title" style={{ marginBottom: 8 }}>
          Need something else?
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, lineHeight: 1.55 }}>
          Drop a note to{' '}
          <a
            href="mailto:hello@shakebase.co"
            style={{ color: 'var(--accent-ink)', fontWeight: 500 }}
          >
            hello@shakebase.co
          </a>{' '}
          — tell us which POS, PMS or messaging tool matters to your team and we&rsquo;ll put it on
          the roadmap.
        </p>
      </div>
    </>
  )
}

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div className="col" style={{ gap: 2, marginBottom: 14 }}>
        <div className="page-kicker">{kicker}</div>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 22,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {children}
    </div>
  )
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { label: string; bg: string; color: string }> = {
    connected: { label: 'Connected', bg: '#e3f0e9', color: 'var(--ok)' },
    available: { label: 'Available', bg: 'var(--bg-sunken)', color: 'var(--ink-2)' },
    planned: { label: 'Planned', bg: 'var(--bg-sunken)', color: 'var(--ink-4)' },
  }
  const { label, bg, color } = map[status]
  return (
    <span
      className="pill"
      style={{
        background: bg,
        color,
        borderColor: 'transparent',
        fontSize: 10.5,
      }}
    >
      {status === 'connected' && <Icon name="check" size={10} />}
      {label}
    </span>
  )
}

function Card({ integration }: { integration: Integration }) {
  const { name, blurb, icon, status, cta, detail } = integration
  return (
    <div
      className="card card-pad"
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: status === 'planned' ? 0.7 : 1,
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: status === 'connected' ? 'var(--accent-wash)' : 'var(--bg-sunken)',
            display: 'grid',
            placeItems: 'center',
            color: status === 'connected' ? 'var(--accent-ink)' : 'var(--ink-2)',
          }}
        >
          <Icon name={icon} size={18} />
        </div>
        <StatusPill status={status} />
      </div>
      <div className="col" style={{ gap: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{name}</div>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            color: 'var(--ink-3)',
            lineHeight: 1.55,
          }}
          dangerouslySetInnerHTML={{ __html: blurb }}
        />
      </div>
      {detail && (
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {detail}
        </div>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="btn-secondary"
          style={{ alignSelf: 'flex-start', marginTop: 'auto' }}
        >
          {cta.label}
          <Icon name="chevron-r" size={11} />
        </Link>
      )}
    </div>
  )
}
