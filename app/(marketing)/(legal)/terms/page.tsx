export const metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern your use of ShakeBase — a multi-tenant cocktail library for hospitality teams.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <>
      <h1>
        Terms of <span className="it">Service.</span>
      </h1>
      <div className="meta">
        <span>Last updated · April 22, 2026</span>
        <span className="sep">·</span>
        <span>Effective immediately</span>
      </div>

      <p className="lede">
        These terms form a binding agreement between you and ShakeBase, Inc.
        (&ldquo;ShakeBase,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). By creating a
        workspace or using any part of the Service, you agree to them. If
        you&rsquo;re accepting on behalf of an organization, you represent you have
        authority to bind it.
      </p>

      <h2>1. The Service</h2>
      <p>
        ShakeBase provides a cloud platform for managing cocktail recipes, ingredient
        catalogs, creator profiles, and menu analytics. We operate it on a
        software-as-a-service basis, and we may add, change, or remove features from
        time to time.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for the security of your credentials and for all activity
        on workspaces you own. Don&rsquo;t share seats. Don&rsquo;t let anyone access
        your account who hasn&rsquo;t also agreed to these terms. Notify us promptly
        at <a href="mailto:security@shakebase.co">security@shakebase.co</a> if you
        suspect unauthorized access.
      </p>

      <h2>3. Your content</h2>
      <p>
        You retain ownership of everything you upload — cocktails, recipes, images,
        method notes, creator data, analytics. We only process it to operate the
        Service, as described in our <a href="/privacy">Privacy Policy</a>. You grant
        us a limited license to store, transmit, and display your content inside your
        workspace for this purpose.
      </p>
      <p>
        You represent that you have the rights to everything you upload and that it
        doesn&rsquo;t infringe anyone else&rsquo;s rights.
      </p>

      <h2>4. Acceptable use</h2>
      <ul>
        <li>No scraping or automated access outside documented APIs.</li>
        <li>No harassment, illegal content, or intellectual-property infringement.</li>
        <li>No circumvention of billing, rate limits, or security controls.</li>
        <li>No reverse-engineering or competing service derived from the Service.</li>
      </ul>
      <p>
        We may suspend or terminate accounts that violate these rules, with notice
        where reasonably possible.
      </p>

      <h2>5. Plans, billing, and trials</h2>
      <p>
        Paid plans renew automatically at the end of each billing period until you
        cancel. You can cancel any time from <strong>Settings → Billing</strong>;
        cancellation stops renewal but does not refund the current period. Trials
        convert to paid plans on the date shown in your workspace unless canceled
        beforehand.
      </p>
      <p>
        We may change prices with at least 30 days&rsquo; notice to workspace owners.
        Taxes are added where applicable. Refund requests are handled case-by-case;
        email <a href="mailto:billing@shakebase.co">billing@shakebase.co</a>.
      </p>

      <h2>6. Confidentiality</h2>
      <p>
        Each party will protect the other&rsquo;s confidential information with the
        same care it uses for its own, and no less than reasonable care. This
        doesn&rsquo;t apply to information that is public, independently developed,
        or required to be disclosed by law.
      </p>

      <h2>7. Warranty disclaimer</h2>
      <p>
        The Service is provided <strong>&ldquo;as is&rdquo;</strong> and{' '}
        <strong>&ldquo;as available.&rdquo;</strong> To the maximum extent permitted
        by law, we disclaim all warranties, including merchantability, fitness for a
        particular purpose, and non-infringement. We don&rsquo;t warrant that the
        Service will be uninterrupted or error-free.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, neither party will be liable for any
        indirect, incidental, special, consequential, or punitive damages, or for
        lost profits, revenues, data, or goodwill. Each party&rsquo;s total liability
        arising out of these terms in any 12-month period will not exceed the amount
        you paid to us during that period.
      </p>

      <h2>9. Indemnification</h2>
      <p>
        You agree to defend and indemnify ShakeBase against third-party claims
        arising from your content, your use of the Service in violation of these
        terms, or your violation of applicable law. We&rsquo;ll notify you promptly
        of any claim and let you control the defense, at your expense.
      </p>

      <h2>10. Termination</h2>
      <p>
        You can delete your workspace any time, which cancels the plan and erases
        associated data within 30 days (subject to legal retention requirements). We
        may suspend or terminate accounts for material breach, non-payment, or legal
        reasons, with notice where reasonably possible.
      </p>

      <h2>11. Governing law and disputes</h2>
      <p>
        These terms are governed by the laws of the State of Delaware, without regard
        to its conflict-of-laws rules. Any dispute will be resolved exclusively in
        the state or federal courts located in New Castle County, Delaware, and both
        parties consent to personal jurisdiction there.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these terms when material changes happen. We&rsquo;ll notify
        workspace owners by email at least 14 days before changes take effect.
        Continued use after that counts as acceptance.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these terms?{' '}
        <a href="mailto:legal@shakebase.co">legal@shakebase.co</a>.
      </p>

      <div className="note">
        This is intended as a plain-language summary you can actually read. Nothing
        here replaces a signed enterprise agreement; contact{' '}
        <a href="mailto:sales@shakebase.co">sales@shakebase.co</a> for MSAs, BAAs, or
        jurisdiction-specific provisions.
      </div>
    </>
  )
}
