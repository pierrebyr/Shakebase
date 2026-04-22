import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="foot">
      <div className="wrap-wide">
        <div className="foot-grid">
          <div className="brand-col">
            <Link className="brand" href="/">
              <span className="mark">S</span>
              <span>ShakeBase</span>
            </Link>
            <p>The cocktail intelligence platform for spirits brands and bar groups.</p>
            <h6
              style={{
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Get the monthly pour
            </h6>
            <form
              className="foot-newsletter"
              action="/api/newsletter"
              method="POST"
            >
              <input type="email" name="email" placeholder="you@brand.com" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
          <div className="mk-col">
            <h6>Product</h6>
            <ul>
              <li>
                <Link href="/#product">Library</Link>
              </li>
              <li>
                <Link href="/#tour">Analytics</Link>
              </li>
              <li>
                <Link href="/#product">Creators</Link>
              </li>
              <li>
                <Link href="/#product">Ingredients</Link>
              </li>
              <li>
                <Link href="/#product">Integrations</Link>
              </li>
              <li>
                <Link href="/#pricing">Pricing</Link>
              </li>
            </ul>
          </div>
          <div className="mk-col">
            <h6>Company</h6>
            <ul>
              <li>
                <span className="foot-soon">About · soon</span>
              </li>
              <li>
                <span className="foot-soon">Customers · soon</span>
              </li>
              <li>
                <span className="foot-soon">Careers · soon</span>
              </li>
              <li>
                <span className="foot-soon">Press · soon</span>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="mk-col">
            <h6>Developers</h6>
            <ul>
              <li>
                <span className="foot-soon">API reference · soon</span>
              </li>
              <li>
                <span className="foot-soon">Webhooks · soon</span>
              </li>
              <li>
                <span className="foot-soon">Status · soon</span>
              </li>
              <li>
                <span className="foot-soon">Changelog · soon</span>
              </li>
              <li>
                <span className="foot-soon">Open source · soon</span>
              </li>
            </ul>
          </div>
          <div className="mk-col">
            <h6>Legal</h6>
            <ul>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/dpa">DPA</Link>
              </li>
              <li>
                <Link href="/security">Security</Link>
              </li>
              <li>
                <Link href="/cookies">Cookies</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-base">
          <span>© 2026 ShakeBase · Paris · New York · Mexico City</span>
          <span>Made with very long spoons in seven cities.</span>
        </div>
      </div>
    </footer>
  )
}
