export const metadata = {
  title: 'Cookie Policy',
  description:
    'ShakeBase uses only the cookies strictly necessary to keep you signed in and route you to the right workspace.',
  alternates: { canonical: '/cookies' },
}

export default function CookiesPage() {
  return (
    <>
      <h1>
        Cookie <span className="it">policy.</span>
      </h1>
      <div className="meta">
        <span>Last updated · April 22, 2026</span>
      </div>

      <p className="lede">
        ShakeBase uses the minimum set of cookies needed to keep you signed in and
        route you to the right workspace. No analytics trackers, no ad networks,
        no session replays.
      </p>

      <h2>What we set</h2>
      <ul>
        <li>
          <strong>sb-access-token</strong> · authentication session, issued by
          Supabase. Expires on sign-out or after 7 days of inactivity.
        </li>
        <li>
          <strong>sb-refresh-token</strong> · keeps your session alive across
          browser restarts. Same retention as above.
        </li>
        <li>
          <strong>__Host-ws-slug</strong> · remembers the last workspace subdomain
          you visited so the app can short-circuit redirects. 30-day retention.
        </li>
      </ul>

      <h2>What we don&rsquo;t set</h2>
      <ul>
        <li>No third-party analytics or advertising cookies.</li>
        <li>No cross-site tracking pixels.</li>
        <li>No session replays.</li>
        <li>No fingerprinting SDKs.</li>
      </ul>

      <h2>Control</h2>
      <p>
        Because every cookie above is strictly necessary for the Service to work, we
        don&rsquo;t show a consent banner. You can clear cookies from your
        browser&rsquo;s privacy settings at any time — doing so will sign you out.
      </p>

      <p>
        Questions? <a href="mailto:privacy@shakebase.co">privacy@shakebase.co</a>.
      </p>
    </>
  )
}
