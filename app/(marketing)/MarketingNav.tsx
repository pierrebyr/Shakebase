import Link from 'next/link'

type Props = { active?: 'home' | 'contact' }

export function MarketingNav({ active }: Props) {
  void active
  return (
    <header className="navbar">
      <div className="wrap-wide nav-inner">
        <Link className="brand" href="/">
          <span className="mark">S</span>
          <span>ShakeBase</span>
        </Link>
        <nav className="nav-links">
          <Link href="/#product">Product</Link>
          <Link href="/#tour">Tour</Link>
          <Link href="/#customers">Customers</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#developers">Developers</Link>
        </nav>
        <div className="nav-cta">
          <Link className="mk-btn ghost" href="/contact">
            Contact
          </Link>
          <Link className="mk-btn ghost" href="/login">
            Sign in
          </Link>
          <Link className="mk-btn amber" href="/signup">
            Start free trial →
          </Link>
        </div>
      </div>
    </header>
  )
}
