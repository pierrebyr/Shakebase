import Link from 'next/link'
import { MarketingNav } from '../MarketingNav'
import { MarketingFooter } from '../MarketingFooter'
import { ContactForm } from './ContactForm'
import { Reveal } from '@/components/motion/Reveal'
import { Stagger } from '@/components/motion/Stagger'
import { FaqItem } from '@/components/motion/FaqItem'
import '../marketing.css'

export const metadata = {
  title: 'Contact',
  description:
    'Talk to sales, book a demo, or reach support. Real people, reasonable hours. Median first reply: 3 hours on weekdays.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="mk-scope">
      <MarketingNav active="contact" />

      <section className="page-hero">
        <Stagger className="wrap" stagger={0.07} distance={18} amount={0.01}>
          <div className="crumbs">
            <Link href="/">ShakeBase</Link>
            <span className="sep">/</span>
            <span>Contact</span>
          </div>
          <div className="eyebrow">Contact · hello@shakebase.co</div>
          <h1>
            Let&rsquo;s talk <span className="it">through the pour.</span>
          </h1>
          <p className="lede">
            Whether you&rsquo;re rolling out a 400-venue canon or just want to see what a workspace
            feels like — we&rsquo;re here. Real people, reasonable hours, honest answers. Median
            first reply: 3 hours on weekdays.
          </p>
        </Stagger>
      </section>

      <ContactForm />

      {/* OFFICES */}
      <section className="offices">
        <div className="wrap">
          <Stagger className="section-head" stagger={0.08}>
            <div className="eyebrow">Offices</div>
            <h2 className="section-title">
              Three rooms, <span className="it">one pour.</span>
            </h2>
            <p className="section-sub">
              Drop in for a tasting, a whiteboard, or just a flat white. We&rsquo;ve always got a
              bottle open somewhere.
            </p>
          </Stagger>
          {/* Plain grid — offices stretch to equal row height. */}
          <div className="offices-grid">
            <article className="office">
              <div className="map">
                <svg viewBox="0 0 200 112" preserveAspectRatio="none">
                  <path
                    d="M0,70 Q30,65 60,72 T120,68 T200,75"
                    stroke="rgba(47,94,122,0.35)"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <path
                    d="M0,85 Q40,80 80,83 T160,86 T200,88"
                    stroke="rgba(47,94,122,0.2)"
                    strokeWidth="1"
                    fill="none"
                  />
                  <circle
                    cx="120"
                    cy="60"
                    r="14"
                    fill="rgba(196,145,85,0.1)"
                    stroke="rgba(196,145,85,0.3)"
                    strokeDasharray="2 2"
                  />
                </svg>
                <div className="pin" style={{ top: '54%', left: '60%' }} />
                <span className="city-label">Paris</span>
                <span className="tag">HQ</span>
              </div>
              <div className="info">
                <div className="addr">
                  <strong>ShakeBase SAS</strong>
                  14 rue des Archives
                  <br />
                  75004 Paris, France
                </div>
                <div className="meta">
                  <span>
                    <b>32</b> people
                  </span>
                  <span>
                    <b>Eng · Design · Sales</b>
                  </span>
                </div>
              </div>
            </article>

            <article className="office">
              <div className="map">
                <svg viewBox="0 0 200 112" preserveAspectRatio="none">
                  <path
                    d="M0,60 Q50,40 100,55 T200,50"
                    stroke="rgba(47,94,122,0.35)"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <path
                    d="M30,0 L30,112"
                    stroke="rgba(47,94,122,0.2)"
                    strokeWidth="1"
                  />
                  <path
                    d="M170,0 L170,112"
                    stroke="rgba(47,94,122,0.2)"
                    strokeWidth="1"
                  />
                  <circle
                    cx="90"
                    cy="70"
                    r="18"
                    fill="rgba(196,145,85,0.1)"
                    stroke="rgba(196,145,85,0.3)"
                    strokeDasharray="2 2"
                  />
                </svg>
                <div className="pin" style={{ top: '62%', left: '45%' }} />
                <span className="city-label">New York</span>
                <span className="tag">Americas</span>
              </div>
              <div className="info">
                <div className="addr">
                  <strong>ShakeBase Inc.</strong>
                  80 Pine St, 22nd Floor
                  <br />
                  New York, NY 10005
                </div>
                <div className="meta">
                  <span>
                    <b>14</b> people
                  </span>
                  <span>
                    <b>Sales · Success</b>
                  </span>
                </div>
              </div>
            </article>

            <article className="office">
              <div className="map">
                <svg viewBox="0 0 200 112" preserveAspectRatio="none">
                  <path
                    d="M0,50 Q40,60 80,45 T200,55"
                    stroke="rgba(196,145,85,0.35)"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <path
                    d="M0,80 Q60,70 120,82 T200,80"
                    stroke="rgba(196,145,85,0.2)"
                    strokeWidth="1"
                    fill="none"
                  />
                  <circle
                    cx="110"
                    cy="62"
                    r="16"
                    fill="rgba(196,145,85,0.1)"
                    stroke="rgba(196,145,85,0.3)"
                    strokeDasharray="2 2"
                  />
                </svg>
                <div className="pin" style={{ top: '55%', left: '55%' }} />
                <span className="city-label">CDMX</span>
                <span className="tag">Tasting studio</span>
              </div>
              <div className="info">
                <div className="addr">
                  <strong>ShakeBase México S.A.</strong>
                  Calle Colima 237, Roma Norte
                  <br />
                  06700 Cuauhtémoc, CDMX
                </div>
                <div className="meta">
                  <span>
                    <b>7</b> people
                  </span>
                  <span>
                    <b>Partnerships · R&amp;D</b>
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* QUICK ANSWERS */}
      <section className="quick-answers">
        <div className="wrap">
          <div className="qa-layout">
            <Reveal from="left" distance={24} className="section-head" style={{ marginBottom: 0 }}>
              <div className="eyebrow">Before you write</div>
              <h2 className="section-title">
                Maybe we&rsquo;ve <span className="it">already answered.</span>
              </h2>
              <p className="section-sub">
                A few questions that come up most often. The full knowledge base has 140+ answers
                and live search.
              </p>
              <a className="mk-btn sec" href="#" style={{ marginTop: 20 }}>
                Browse the knowledge base →
              </a>
            </Reveal>

            <Stagger className="qa-list" stagger={0.07} distance={14}>
              {[
                {
                  q: 'Can I see the product before talking to sales?',
                  a: (
                    <>
                      Yes — our live demo workspace is open. Head to{' '}
                      <Link href="/login">sign in</Link> for a fully populated sandbox workspace
                      with sample recipes, analytics, and creator profiles.
                    </>
                  ),
                  open: true,
                },
                {
                  q: 'Do you offer a free trial?',
                  a: 'Every new workspace gets 14 days free — no credit card, up to 10 teammates, every Studio feature. Check "Include a 14-day trial invite" in the form and we\'ll set you up.',
                },
                {
                  q: 'How long does implementation take?',
                  a: 'Median white-glove onboarding: 8 business days for a 50-venue workspace. That includes POS integration (Toast, Lightspeed, Square), SSO setup, historical recipe migration, and creator attribution.',
                },
                {
                  q: 'What POS systems do you integrate with?',
                  a: "Native: Toast, Lightspeed, Revel, Square, Clover. REST API or Zapier for the long tail. We publish connector SLAs on our status page and fingerprint each vendor's webhook idempotency behaviour.",
                },
                {
                  q: 'Is this a procurement-friendly purchase?',
                  a: "For Enterprise, yes — we sign redlines on the MSA, share our DPA, and offer pre-paid invoicing plus net-30/60 terms. Our infrastructure (Vercel + Supabase) is SOC 2 Type II; a ShakeBase-level audit is on the roadmap. Reach out and we'll walk your procurement team through what's available today.",
                },
                {
                  q: 'Can I bring my own domain?',
                  a: (
                    <>
                      Yes, on Studio Plus and Enterprise. Bring{' '}
                      <code>drinks.yourbrand.com</code> or similar — we handle the ACME certs, DNS
                      guidance, and whitelabel the entire workspace to your brand colour system.
                    </>
                  ),
                },
              ].map(({ q, a, open }) => (
                <FaqItem key={q} className="qa-item" question={q} defaultOpen={open}>
                  <div className="qa-a">{a}</div>
                </FaqItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
