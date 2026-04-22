import Link from 'next/link'
import { cookies } from 'next/headers'
import { requireUser } from '@/lib/auth/session'
import { Icon } from '@/components/icons'
import { signOutOthersAction } from './actions'

type GotrueSession = {
  id: string
  user_id: string
  created_at: string | null
  updated_at: string | null
  refreshed_at: string | null
  not_after: string | null
  user_agent: string | null
  ip: string | null
  factor_id: string | null
  aal: string | null
}

function parseUserAgent(ua: string | null): { device: string; client: string } {
  if (!ua) return { device: 'Unknown device', client: '' }
  const mobile = /Mobile|iPhone|Android/i.test(ua)
  const mac = /Mac OS X/i.test(ua)
  const win = /Windows/i.test(ua)
  const linux = /Linux/i.test(ua) && !/Android/i.test(ua)
  const ios = /iPhone|iPad/i.test(ua)
  const android = /Android/i.test(ua)
  let device = 'Unknown device'
  if (ios) device = 'iPhone · iOS'
  else if (android) device = 'Android'
  else if (mac) device = mobile ? 'macOS · mobile' : 'Mac'
  else if (win) device = 'Windows PC'
  else if (linux) device = 'Linux'

  let client = ''
  const m = ua.match(/(Chrome|Firefox|Safari|Edg|Opera)\/([\d.]+)/)
  if (m) {
    const [, name, ver] = m
    client = `${name === 'Edg' ? 'Edge' : name} ${ver?.split('.')[0] ?? ''}`.trim()
  }
  return { device, client }
}

function relTime(iso: string | null): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

async function fetchSessions(userId: string): Promise<GotrueSession[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(`${url}/auth/v1/admin/users/${userId}/sessions`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.sessions ?? data ?? []) as GotrueSession[]
  } catch {
    return []
  }
}

export default async function SessionsPage() {
  const user = await requireUser()
  const sessions = await fetchSessions(user.id)

  // Identify the current session via Supabase's refresh-token cookie.
  const cookieStore = await cookies()
  const authCookie = cookieStore.getAll().find((c) => c.name.endsWith('-auth-token'))
  const currentRefreshToken = (() => {
    if (!authCookie) return null
    try {
      const raw = authCookie.value.startsWith('base64-')
        ? Buffer.from(authCookie.value.slice(7), 'base64').toString('utf-8')
        : decodeURIComponent(authCookie.value)
      const parsed = JSON.parse(raw)
      return (parsed.refresh_token as string) ?? null
    } catch {
      return null
    }
  })()

  const sorted = [...sessions].sort((a, b) => {
    const at = new Date(a.refreshed_at ?? a.updated_at ?? a.created_at ?? 0).getTime()
    const bt = new Date(b.refreshed_at ?? b.updated_at ?? b.created_at ?? 0).getTime()
    return bt - at
  })

  const others = sorted.length > 1 ? sorted.length - 1 : 0

  return (
    <>
      <div className="page-head">
        <div className="page-kicker">Account</div>
        <h1 className="page-title">Sessions.</h1>
        <p className="page-sub">
          Devices currently signed in to your account. Sign out anything you don&rsquo;t recognize.
        </p>
      </div>

      <div className="col" style={{ gap: 20 }}>
        <div className="card card-pad" style={{ padding: 0, overflow: 'hidden' }}>
          {sorted.length === 0 ? (
            <div
              style={{
                padding: 28,
                color: 'var(--ink-4)',
                fontSize: 13.5,
                textAlign: 'center',
              }}
            >
              No session data available. Your current session is active; older devices will appear
              here after the next refresh.
            </div>
          ) : (
            sorted.map((s, i) => {
              const ua = parseUserAgent(s.user_agent)
              const isCurrent =
                currentRefreshToken != null && i === 0 // best effort: newest refreshed is current
              return (
                <div
                  key={s.id}
                  className="row"
                  style={{
                    padding: '16px 20px',
                    gap: 14,
                    alignItems: 'center',
                    borderTop: i ? '1px solid var(--line-2)' : 'none',
                    background: isCurrent ? 'var(--accent-wash)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'var(--bg-sunken)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--ink-2)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      name={
                        ua.device.includes('iPhone') || ua.device.includes('Android')
                          ? 'phone'
                          : 'monitor'
                      }
                      size={18}
                    />
                  </div>
                  <div className="col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{ua.device}</span>
                      {ua.client && (
                        <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                          · {ua.client}
                        </span>
                      )}
                      {isCurrent && (
                        <span
                          className="pill"
                          style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            borderColor: 'transparent',
                            fontSize: 10.5,
                          }}
                        >
                          This device
                        </span>
                      )}
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: 'var(--ink-4)' }}
                    >
                      {s.ip ?? 'unknown ip'} · active {relTime(s.refreshed_at ?? s.updated_at)}
                      {s.aal === 'aal2' ? ' · 2FA' : ''}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div
          className="card card-pad"
          style={{ padding: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
        >
          <div className="col" style={{ gap: 4 }}>
            <div className="panel-title">Sign out of other devices</div>
            <p style={{ fontSize: 12.5, color: 'var(--ink-4)', margin: 0 }}>
              {others > 0
                ? `${others} other ${others === 1 ? 'device is' : 'devices are'} signed in. Revoking won't sign you out here.`
                : 'No other sessions detected. Revoke anyway to invalidate any stray refresh tokens.'}
            </p>
          </div>
          <form action={signOutOthersAction}>
            <button type="submit" className="btn-secondary" style={{ color: 'var(--crit)' }}>
              <Icon name="x" size={13} />
              Revoke others
            </button>
          </form>
        </div>

        <div
          className="card card-pad"
          style={{
            padding: 22,
            background: 'var(--bg-sunken)',
            border: '1px dashed var(--line-1)',
            boxShadow: 'none',
          }}
        >
          <div className="panel-title" style={{ marginBottom: 8 }}>
            Security tips
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 13,
              color: 'var(--ink-3)',
              lineHeight: 1.7,
            }}
          >
            <li>Revoke sessions on devices you&rsquo;ve sold or lost before handing them off.</li>
            <li>Sessions expire automatically after inactivity — you don&rsquo;t need to prune them.</li>
            <li>
              If you see an unfamiliar IP, change your password in{' '}
              <Link href="/settings/security" style={{ color: 'var(--accent-ink)' }}>
                Security
              </Link>{' '}
              and revoke all other sessions.
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
