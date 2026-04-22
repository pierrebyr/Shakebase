export const metadata = {
  title: 'Privacy Policy',
  description:
    'What ShakeBase collects, why, where it lives, and how to control it. No tracking, no selling, no dark patterns.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <>
      <h1>
        Privacy <span className="it">Policy.</span>
      </h1>
      <div className="meta">
        <span>Last updated · April 22, 2026</span>
      </div>

      <p className="lede">
        We collect the minimum data needed to run ShakeBase and never sell it. This
        page explains what we collect, why, where it lives, and how to control it.
      </p>

      <h2>Who we are</h2>
      <p>
        ShakeBase, Inc. — a Delaware corporation. The people responsible for how
        your data is handled can be reached at{' '}
        <a href="mailto:privacy@shakebase.co">privacy@shakebase.co</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email, job title, workspace slug, and
          authentication tokens.
        </li>
        <li>
          <strong>Content you create:</strong> cocktails, ingredients, creators,
          collections, uploaded images, method notes, tasting notes.
        </li>
        <li>
          <strong>Usage telemetry:</strong> error logs, page timings, and session IP
          addresses, retained 30 days for security and debugging.
        </li>
        <li>
          <strong>Billing:</strong> handled by Stripe. We receive a customer ID and
          subscription status — we never see card details.
        </li>
        <li>
          <strong>Support communication:</strong> anything you send to
          <a href="mailto:hello@shakebase.co"> hello@shakebase.co</a> or through the
          contact form.
        </li>
      </ul>

      <h2>Why we collect it</h2>
      <ul>
        <li>To operate the Service and provision your workspace.</li>
        <li>To bill you and handle plan changes.</li>
        <li>To detect abuse, secure accounts, and debug incidents.</li>
        <li>To send transactional email (invites, password resets, receipts).</li>
      </ul>
      <p>
        We do <strong>not</strong> use your content to train machine-learning models,
        and we do not share it with any third party for marketing purposes.
      </p>

      <h2>Where it lives</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — primary database, authentication, and storage.
          Hosted in the US.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting, serverless functions, and
          edge caching.
        </li>
        <li>
          <strong>Stripe</strong> — payment processing. Subject to Stripe&rsquo;s
          privacy policy.
        </li>
        <li>
          <strong>Resend</strong> — transactional email (invites, password resets,
          receipts, weekly digests).
        </li>
      </ul>
      <p>
        Each of these sub-processors is bound by a data-processing agreement. We
        give notice before adding a new one that processes your workspace data.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Active workspaces: as long as the workspace exists.</li>
        <li>
          Deleted workspaces: erased from primary storage within 30 days, plus up to
          90 days in encrypted backups.
        </li>
        <li>Security logs: 30 days.</li>
        <li>Billing records: retained as required by US tax law (typically 7 years).</li>
      </ul>

      <h2>Your choices</h2>
      <p>
        You can export your workspace data any time from{' '}
        <strong>Settings → Data &amp; export</strong>. You can delete your workspace,
        which erases all associated data subject to the retention schedule above.
      </p>
      <p>
        For access, correction, or deletion requests outside these flows — including
        requests from California residents under the CCPA/CPRA — email{' '}
        <a href="mailto:privacy@shakebase.co">privacy@shakebase.co</a>. We
        respond within 30 days.
      </p>

      <h3>California residents</h3>
      <p>
        Under the California Consumer Privacy Act, you have the right to know what
        we collect, request deletion, correct inaccuracies, and opt out of sale or
        sharing. We don&rsquo;t sell personal information, and we don&rsquo;t share
        it for cross-context behavioral advertising. To exercise any of these
        rights, email <a href="mailto:privacy@shakebase.co">privacy@shakebase.co</a>.
        We will not discriminate against you for exercising them.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a small set of essential cookies (session, workspace routing) and no
        third-party trackers. Details in the <a href="/cookies">Cookie Policy</a>.
      </p>

      <h2>Children</h2>
      <p>
        ShakeBase is not intended for anyone under 18. We do not knowingly collect
        data from minors. If you believe a child has created an account, email{' '}
        <a href="mailto:privacy@shakebase.co">privacy@shakebase.co</a> and
        we&rsquo;ll remove it.
      </p>

      <h2>Security</h2>
      <p>
        We encrypt data in transit (TLS 1.2+) and at rest (AES-256), enforce
        row-level security on every tenant-scoped table, and keep service-role
        credentials server-side only. See <a href="/security">our security page</a>{' '}
        for the full rundown.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        When we make material changes, we notify workspace owners by email at least
        14 days before the changes take effect. Historical versions are available on
        request.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions: <a href="mailto:privacy@shakebase.co">privacy@shakebase.co</a>.
        Legal: <a href="mailto:legal@shakebase.co">legal@shakebase.co</a>.
      </p>
    </>
  )
}
