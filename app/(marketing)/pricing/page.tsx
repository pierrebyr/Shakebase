export default function PricingPage() {
  return (
    <main className="page" style={{ maxWidth: 720, paddingTop: 80 }}>
      <div className="page-kicker">One plan, everything included</div>
      <h1 className="page-title">Studio.</h1>
      <p className="page-sub">Unlimited cocktails, 25 team seats, POS sync, priority R&amp;D support.</p>
      <div className="card card-pad" style={{ marginTop: 28, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1 }}>€480</span>
          <span style={{ color: 'var(--ink-3)' }}>/ month</span>
        </div>
      </div>
    </main>
  )
}
