import Link from 'next/link'

type Props = {
  envPill: string
  helpText: string
  helpHref: string
  helpLink: string
  kicker: string
  title: React.ReactNode
  sub?: React.ReactNode
  children: React.ReactNode
  art: React.ReactNode
}

export function AuthShell({
  envPill,
  helpText,
  helpHref,
  helpLink,
  kicker,
  title,
  sub,
  children,
  art,
}: Props) {
  return (
    <div className="auth-scope">
      <div className="auth-root">
        <div className="aurora" />
        <div className="auth-form-wrap">
          <div className="auth-top">
            <Link href="/" className="brand-row">
              <span className="brand-mark">S</span>
              <span>ShakeBase</span>
            </Link>
            <span className="env-pill">{envPill}</span>
            <span className="auth-help">
              {helpText}{' '}
              <Link href={helpHref}>{helpLink}</Link>
            </span>
          </div>

          <div className="auth-card">
            <div className="auth-kicker">{kicker}</div>
            <h1 className="auth-title">{title}</h1>
            {sub && <p className="auth-sub">{sub}</p>}
            {children}
          </div>

          <div className="auth-foot">
            <span className="status">
              <span className="dot" /> All systems operational
            </span>
            <span>© 2026 ShakeBase</span>
          </div>
        </div>
        {art}
      </div>
    </div>
  )
}
