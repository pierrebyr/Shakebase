export const metadata = {
  title: 'Security',
  description:
    'Defense-in-depth across Vercel and Supabase: TLS, row-level security, encrypted backups, and a responsible-disclosure program.',
  alternates: { canonical: '/security' },
}

export default function SecurityPage() {
  return (
    <>
      <h1>
        <span className="it">Security.</span>
      </h1>
      <div className="meta">
        <span>Last updated · April 22, 2026</span>
      </div>

      <p className="lede">
        ShakeBase runs on a defense-in-depth stack. This page summarizes the
        practical controls. For vendor-level certifications, see our
        sub-processors&rsquo; SOC 2 reports directly.
      </p>

      <h2>Infrastructure</h2>
      <ul>
        <li>Hosted on Vercel + Supabase — both SOC 2 Type II certified.</li>
        <li>US-region primary database; daily encrypted snapshots off-site.</li>
        <li>TLS 1.2+ in transit. AES-256 at rest on all managed storage.</li>
        <li>HSTS + secure cookie flags on all authenticated routes.</li>
      </ul>

      <h2>Access control</h2>
      <ul>
        <li>
          Row-level security on every table exposed to the Data API. Tenants never
          see another tenant&rsquo;s rows, even in the unlikely event of a query
          filter bug.
        </li>
        <li>Per-workspace role model: owner / editor / viewer.</li>
        <li>
          Service-role keys live server-side only and never ship to the browser.
        </li>
        <li>Supabase leaked-password protection enforced on signup.</li>
      </ul>

      <h2>Application</h2>
      <ul>
        <li>All mutations pass through server actions with Zod input validation.</li>
        <li>CSRF mitigated via same-site cookies and Next.js server action tokens.</li>
        <li>Rate limits on authentication and public endpoints.</li>
        <li>Stripe webhook signatures verified end-to-end.</li>
      </ul>

      <h2>Operations</h2>
      <ul>
        <li>Automated daily backups; 30-day retention on managed snapshots.</li>
        <li>Audit logs on billing, team membership, and data-export events.</li>
        <li>Incident response playbook + 72-hour breach notification commitment.</li>
      </ul>

      <h2>Responsible disclosure</h2>
      <p>
        Found a vulnerability? Email{' '}
        <a href="mailto:security@shakebase.co">security@shakebase.co</a> with
        reproduction steps. We acknowledge reports within 48 hours and credit
        reporters in release notes once a fix ships.
      </p>

      <div className="note">
        Need a SOC 2 report, penetration test summary, or a signed MSA? Email{' '}
        <a href="mailto:security@shakebase.co">security@shakebase.co</a> — most
        enterprise requests can be turned around within a week.
      </div>
    </>
  )
}
