export const metadata = {
  title: 'Data Processing Summary',
  description:
    'How ShakeBase processes your data on your behalf — sub-processors, security measures, breach notification, deletion.',
  alternates: { canonical: '/dpa' },
}

export default function DPAPage() {
  return (
    <>
      <h1>
        Data Processing <span className="it">Summary.</span>
      </h1>
      <div className="meta">
        <span>Last updated · April 22, 2026</span>
      </div>

      <p className="lede">
        When you use ShakeBase to manage data about your team, creators, or
        customers, we act as a service provider processing that data on your
        behalf. This page summarizes how. For a countersigned addendum on your
        paper, email <a href="mailto:legal@shakebase.co">legal@shakebase.co</a>.
      </p>

      <h2>What we process</h2>
      <p>
        ShakeBase, Inc. processes personal data strictly to operate the Service:
        authentication, workspace hosting, cocktail-library management, analytics,
        and transactional messaging. We do not sell your data and we do not use it
        for advertising or machine-learning model training.
      </p>

      <h2>Sub-processors</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — primary database, authentication, object
          storage. US-region hosting.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and serverless compute.
        </li>
        <li>
          <strong>Stripe</strong> — payment processing. We receive a customer ID
          and subscription status only.
        </li>
        <li>
          <strong>Resend</strong> — transactional email (invites, password resets,
          receipts, weekly digests).
        </li>
      </ul>
      <p>
        We notify workspace owners in writing before adding a new sub-processor and
        give you 30 days to object.
      </p>

      <h2>Security measures</h2>
      <ul>
        <li>TLS 1.2+ in transit; AES-256 at rest.</li>
        <li>Row-level security enforced at the database layer on every tenant-scoped table.</li>
        <li>Role-based access; least-privilege service roles; server-side-only secrets.</li>
        <li>Encrypted backups with 30-day retention.</li>
        <li>See <a href="/security">Security</a> for the full rundown.</li>
      </ul>

      <h2>Data breach notification</h2>
      <p>
        We notify affected workspace owners within 72 hours of becoming aware of a
        confirmed security incident affecting their data, along with the scope,
        mitigation steps, and remediation timeline.
      </p>

      <h2>Retention, deletion, and return</h2>
      <p>
        On cancellation you can export all workspace data for 30 days from{' '}
        <strong>Settings → Data &amp; export</strong>. After 30 days we delete
        production records and purge encrypted backups within an additional 90 days.
        Billing records are retained as required by US tax law.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy requests: <a href="mailto:privacy@shakebase.co">privacy@shakebase.co</a>.
        Contract questions: <a href="mailto:legal@shakebase.co">legal@shakebase.co</a>.
      </p>
    </>
  )
}
