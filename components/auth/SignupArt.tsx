export function SignupArt() {
  return (
    <div className="auth-art">
      <div className="art-frame" />
      <div className="art-top">
        <span className="art-eyebrow">Onboarding · 90 seconds</span>
        <span className="art-meta">
          Next release
          <br />
          <b>Analytics 2.0 · Live</b>
        </span>
      </div>
      <div className="big-orb" />
      <div className="steps-card">
        <h3>What happens next</h3>
        <ol>
          <li>
            <div>
              <b>Claim your subdomain.</b>
              <span>Your team signs in at aurelia.shakebase.co.</span>
            </div>
          </li>
          <li>
            <div>
              <b>Invite your R&amp;D team.</b>
              <span>SSO, per-market roles, seat-based billing after trial.</span>
            </div>
          </li>
          <li>
            <div>
              <b>Write your first spec.</b>
              <span>Or import from Notion, Google Docs, or a CSV of existing recipes.</span>
            </div>
          </li>
        </ol>
      </div>
      <div className="launch-chip">
        <i />
        340 brands live · 12k pours / night
      </div>
    </div>
  )
}
