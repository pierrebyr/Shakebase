import { cookies } from 'next/headers'

type Marker = {
  admin_email?: string
  workspace_name?: string
  owner_email?: string
}

export async function ImpersonationBanner() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('sb_impersonation')?.value
  if (!raw) return null

  let m: Marker = {}
  try {
    m = JSON.parse(raw) as Marker
  } catch {
    return null
  }

  // If the cookie got set with admin == owner (legacy session from before we
  // short-circuited self-impersonation in start/route.ts), don't render the
  // banner — the user is genuinely just themselves.
  if (m.admin_email && m.owner_email && m.admin_email === m.owner_email) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 22px',
        background: 'linear-gradient(90deg, #4a2a15, #6a3d1f)',
        color: '#fff',
        fontSize: 12.5,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: '#e2b35a',
          boxShadow: '0 0 0 0 rgba(226,179,90,0.6)',
          animation: 'op-pulse 1.6s infinite',
        }}
      ></span>
      <span
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#e2b35a',
        }}
      >
        Impersonating
      </span>
      <span style={{ color: 'rgba(255,255,255,0.75)' }}>
        You are signed in as <b style={{ color: '#fff' }}>{m.owner_email ?? '—'}</b>
        {m.workspace_name && (
          <>
            {' '}
            · <b style={{ color: '#fff' }}>{m.workspace_name}</b>
          </>
        )}
        {m.admin_email && (
          <>
            {' '}
            · real actor <span style={{ color: '#fff' }}>{m.admin_email}</span>
          </>
        )}
      </span>
      <form action="/api/impersonate/end" method="POST" style={{ marginLeft: 'auto' }}>
        <button
          type="submit"
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.04em',
            background: 'rgba(0,0,0,0.35)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
          }}
        >
          Exit session
        </button>
      </form>
      <style>{`@keyframes op-pulse { 0% { box-shadow: 0 0 0 0 rgba(226,179,90,0.6); } 70% { box-shadow: 0 0 0 10px rgba(226,179,90,0); } 100% { box-shadow: 0 0 0 0 rgba(226,179,90,0); } }`}</style>
    </div>
  )
}
