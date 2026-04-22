import Link from 'next/link'
import { MarketingNav } from '../MarketingNav'
import { MarketingFooter } from '../MarketingFooter'
import '../marketing.css'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mk-scope">
      <MarketingNav />
      <article className="legal-page">
        <div className="wrap">
          <Link href="/" className="legal-back">
            ← Back to ShakeBase
          </Link>
          <div className="legal-body">{children}</div>
        </div>
      </article>
      <MarketingFooter />
      <style>{`
        .legal-page { padding: 72px 0 120px; }
        .legal-page .legal-back {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-4);
          margin-bottom: 28px;
          transition: color 140ms;
        }
        .legal-page .legal-back:hover { color: var(--ink-2); }
        .legal-body {
          max-width: 720px;
          font-size: 15.5px;
          line-height: 1.72;
          color: var(--ink-2);
        }
        .legal-body h1 {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: clamp(44px, 6vw, 72px);
          line-height: 1;
          letter-spacing: -0.03em;
          margin: 0 0 12px;
          color: var(--ink-1);
          text-wrap: balance;
        }
        .legal-body h1 .it { font-style: italic; font-weight: 300; color: var(--accent-ink); }
        .legal-body .meta {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-4);
          margin-bottom: 40px;
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .legal-body .meta .sep { opacity: 0.4; }
        .legal-body .lede {
          font-size: 19px;
          line-height: 1.55;
          color: var(--ink-2);
          margin: 0 0 40px;
          max-width: 58ch;
        }
        .legal-body h2 {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: 26px;
          letter-spacing: -0.01em;
          margin: 48px 0 14px;
          color: var(--ink-1);
          text-wrap: balance;
        }
        .legal-body h3 {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: 18px;
          margin: 28px 0 8px;
          color: var(--ink-1);
        }
        .legal-body p { margin: 0 0 14px; }
        .legal-body ul { padding-left: 20px; margin: 0 0 14px; }
        .legal-body li { margin-bottom: 6px; }
        .legal-body a {
          color: var(--accent-ink);
          border-bottom: 1px solid rgba(196, 145, 85, 0.35);
          transition: border-color 140ms, color 140ms;
        }
        .legal-body a:hover {
          color: var(--ink-1);
          border-color: var(--accent-ink);
        }
        .legal-body strong { color: var(--ink-1); font-weight: 500; }
        .legal-body .note {
          margin-top: 56px;
          padding: 20px 24px;
          background: var(--bg-sunken);
          border-left: 2px solid var(--accent);
          border-radius: 4px;
          font-size: 13.5px;
          color: var(--ink-3);
        }
      `}</style>
    </div>
  )
}
