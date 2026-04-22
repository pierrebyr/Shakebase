import Link from 'next/link'
import type { SubscriptionStatus } from '@/lib/constants'

type Props = {
  status: SubscriptionStatus | string
  trialEndsAt: string | null
  frozen: boolean
}

export function TrialBanner({ status, trialEndsAt, frozen }: Props) {
  if (frozen) {
    return (
      <div
        style={{
          padding: '10px 28px',
          background: '#fdf0f0',
          borderBottom: '1px solid #f0cccc',
          fontSize: 12.5,
          color: 'var(--crit)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <strong>Workspace frozen.</strong>
        <span style={{ color: 'var(--ink-3)' }}>
          Reading allowed; editing paused. Update billing to restore access.
        </span>
        <Link
          href="/settings/billing"
          style={{ marginLeft: 'auto', color: 'var(--crit)', fontWeight: 500 }}
        >
          Update billing →
        </Link>
      </div>
    )
  }

  if (status === 'trialing' && trialEndsAt) {
    const msLeft = new Date(trialEndsAt).getTime() - Date.now()
    const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))
    return (
      <div
        style={{
          padding: '10px 28px',
          background: 'var(--accent-wash)',
          borderBottom: '1px solid rgba(196,145,85,0.3)',
          fontSize: 12.5,
          color: 'var(--accent-ink)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <strong>
          Trial · {daysLeft} day{daysLeft === 1 ? '' : 's'} left
        </strong>
        <span style={{ color: 'var(--ink-3)' }}>
          No charge until {new Date(trialEndsAt).toLocaleDateString()}. Card on file is preserved.
        </span>
      </div>
    )
  }

  if (status === 'past_due') {
    return (
      <div
        style={{
          padding: '10px 28px',
          background: '#f6e9cf',
          borderBottom: '1px solid rgba(196,138,31,0.3)',
          fontSize: 12.5,
          color: 'var(--warn)',
        }}
      >
        <strong>Payment past due.</strong>{' '}
        <span style={{ color: 'var(--ink-3)' }}>
          We&apos;ll retry automatically. Workspace will freeze if unresolved after 3 days.
        </span>
      </div>
    )
  }

  return null
}
