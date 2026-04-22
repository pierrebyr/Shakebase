'use client'

import { useActionState, useState } from 'react'
import { submitContactAction, type ContactResult } from './actions'

const initial: ContactResult = { ok: false, error: '' }

const TOPICS = [
  { id: 'sales', label: 'Sales' },
  { id: 'demo', label: 'Demo' },
  { id: 'support', label: 'Support' },
  { id: 'security', label: 'Security' },
  { id: 'press', label: 'Press' },
  { id: 'partnership', label: 'Partners' },
] as const

type Topic = (typeof TOPICS)[number]['id']

type Props = { initialTopic?: Topic }

export function ContactForm({ initialTopic = 'sales' }: Props) {
  const [state, action, pending] = useActionState(submitContactAction, initial)
  const [topic, setTopic] = useState<Topic>(initialTopic)
  const [activeReason, setActiveReason] = useState<string>(initialTopic)

  const submitted = state && 'ok' in state && state.ok

  return (
    <>
      {/* REASON CARDS */}
      <section className="reasons">
        <div className="wrap">
          <div className="reasons-grid">
            {[
              {
                id: 'sales',
                ico: 'S',
                h: 'Talk to sales',
                p: 'Workspace sizing, SSO, volume pricing, annual commitments.',
                meta: 'Typical reply · 3h',
              },
              {
                id: 'demo',
                ico: 'D',
                h: 'Book a demo',
                p: '30-min walk-through of the library, analytics and creator profile flow.',
                meta: 'Live Tue–Thu',
              },
              {
                id: 'support',
                ico: '?',
                h: 'Product support',
                p: "Something's off in your workspace — ingredients, integrations or access.",
                meta: '24/5 coverage',
              },
              {
                id: 'press',
                ico: 'P',
                h: 'Press & partners',
                p: 'Media requests, distributor partnerships, co-marketing with spirits brands.',
                meta: 'press@shakebase.co',
              },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                className="reason"
                data-active={activeReason === r.id}
                onClick={() => {
                  setActiveReason(r.id)
                  const t = (r.id === 'press' ? 'press' : (r.id as Topic))
                  setTopic(t)
                  document.getElementById('form-card')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              >
                <div className="ico">{r.ico}</div>
                <div>
                  <h4>{r.h}</h4>
                  <p>{r.p}</p>
                </div>
                <div className="meta">{r.meta}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="contact-body">
        <div className="wrap">
          <div className="contact-layout">
            <div className="form-card" id="form-card">
              {submitted ? (
                <div className="success">
                  <div className="tick">✓</div>
                  <h3>
                    Message <span className="it">received.</span>
                  </h3>
                  <p>
                    Thanks {state.firstName ? state.firstName + ', ' : ''}— a human from the{' '}
                    {state.topic} team will be back to you within 3 hours during our working day.
                  </p>
                  <div className="ticket">
                    Ticket <b>{state.ticket}</b> · queued to {state.topic}@shakebase.co
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-head">
                    <h2>
                      Tell us <span className="it">what you&rsquo;re pouring.</span>
                    </h2>
                    <p>A few details so the right person picks it up — not a ticket queue.</p>
                  </div>
                  <form className="contact-form" action={action}>
                    <div className="field">
                      <label>
                        First name <span className="req">*</span>
                      </label>
                      <input name="first" required placeholder="Eli" />
                    </div>
                    <div className="field">
                      <label>
                        Last name <span className="req">*</span>
                      </label>
                      <input name="last" required placeholder="Marchant" />
                    </div>
                    <div className="field">
                      <label>
                        Work email <span className="req">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="eli@casadragones.com"
                      />
                    </div>
                    <div className="field">
                      <label>Company / Brand</label>
                      <input name="company" placeholder="Aurelia Spirits" />
                    </div>
                    <div className="field full">
                      <label>I&rsquo;m reaching out about</label>
                      <div className="seg-radio topics">
                        {TOPICS.map((t) => (
                          <span key={t.id}>
                            <input
                              type="radio"
                              name="topic"
                              id={`t-${t.id}`}
                              value={t.id}
                              checked={topic === t.id}
                              onChange={() => {
                                setTopic(t.id)
                                setActiveReason(t.id)
                              }}
                            />
                            <label htmlFor={`t-${t.id}`}>{t.label}</label>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="field">
                      <label>Role</label>
                      <select name="role" defaultValue="Founder / CEO">
                        <option>Founder / CEO</option>
                        <option>Head of R&amp;D</option>
                        <option>Brand / Marketing</option>
                        <option>Beverage Director</option>
                        <option>Bartender / Creator</option>
                        <option>Investor</option>
                        <option>Journalist</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Venues / Workspace size</label>
                      <select name="size" defaultValue="11–50 venues">
                        <option>1 venue</option>
                        <option>2–10 venues</option>
                        <option>11–50 venues</option>
                        <option>51–200 venues</option>
                        <option>200+ venues</option>
                        <option>Spirits brand (no venues)</option>
                      </select>
                    </div>
                    <div className="field full">
                      <label>
                        Tell us more <span className="req">*</span>
                      </label>
                      <textarea
                        name="message"
                        required
                        placeholder="Rolling out a canon for 34 venues across LATAM — curious about SSO with Okta, ingredient localisation for agave expressions, and whether your Studio plan covers two brand workspaces…"
                      />
                      <div className="hint">
                        The more you share, the faster we can route — usually 2–4 hours during EU /
                        Americas working hours.
                      </div>
                    </div>
                    <div className="field full">
                      <div className="seg-radio">
                        <span>
                          <input type="checkbox" id="urgent" name="urgent" />
                          <label htmlFor="urgent">Urgent — we&rsquo;re live in production</label>
                        </span>
                        <span>
                          <input type="checkbox" id="trial" name="trial" />
                          <label htmlFor="trial">Include a 14-day trial invite</label>
                        </span>
                        <span>
                          <input type="checkbox" id="nda" name="nda" />
                          <label htmlFor="nda">Under NDA already</label>
                        </span>
                      </div>
                    </div>
                    {!state.ok && 'error' in state && state.error && (
                      <div
                        className="field full"
                        style={{
                          color: 'var(--crit)',
                          fontSize: 12.5,
                        }}
                      >
                        {state.error}
                      </div>
                    )}
                    <div
                      className="form-foot"
                      style={{
                        margin: '0 -36px -36px',
                      }}
                    >
                      <div className="consent">
                        By sending, you agree to our <a href="/privacy">privacy policy</a>. We
                        never share details, and we don&rsquo;t train on your cocktail data.
                      </div>
                      <button
                        type="submit"
                        className="mk-btn amber lg"
                        disabled={pending}
                      >
                        {pending ? 'Sending…' : 'Send message →'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            <aside>
              <div className="side-card">
                <div className="eyebrow">Direct channels</div>
                <h3>Skip the form.</h3>
                <p>
                  Sometimes the form is too much ceremony. Reach us directly — these inboxes are
                  monitored by humans, not bots.
                </p>
                <ul className="channel-list">
                  <li>
                    <div className="ico">
                      <svg viewBox="0 0 24 24">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 7l9 6 9-6" />
                      </svg>
                    </div>
                    <div className="info">
                      <div className="mlabel">Sales</div>
                      <div className="val mono">sales@shakebase.co</div>
                      <div className="meta">Replies within 3h, Mon–Fri</div>
                    </div>
                  </li>
                  <li>
                    <div className="ico">
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
                      </svg>
                    </div>
                    <div className="info">
                      <div className="mlabel">Support</div>
                      <div className="val mono">help@shakebase.co</div>
                      <div className="meta">24/5 · 2h median for paid plans</div>
                    </div>
                  </li>
                  <li>
                    <div className="ico">
                      <svg viewBox="0 0 24 24">
                        <path d="M4 4h16v16H4z" />
                        <path d="M4 4l8 8 8-8" />
                      </svg>
                    </div>
                    <div className="info">
                      <div className="mlabel">Press</div>
                      <div className="val mono">press@shakebase.co</div>
                      <div className="meta">Press kit &amp; founder quotes on file</div>
                    </div>
                  </li>
                  <li>
                    <div className="ico">
                      <svg viewBox="0 0 24 24">
                        <path d="M22 16.92V21a1 1 0 0 1-1.11 1 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3.19 4.11 1 1 0 0 1 4.18 3H8.27a1 1 0 0 1 1 .75l1 4a1 1 0 0 1-.29 1L8.21 10.46a16 16 0 0 0 6 6l1.72-1.72a1 1 0 0 1 1-.25l4 1a1 1 0 0 1 .75 1z" />
                      </svg>
                    </div>
                    <div className="info">
                      <div className="mlabel">Phone</div>
                      <div className="val mono">+33 1 84 88 21 40</div>
                      <div className="meta">Paris HQ · 09:00–18:00 CET</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="side-card status-card">
                <div
                  className="eyebrow"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  System status
                </div>
                <h3>All systems nominal.</h3>
                <p>
                  Real-time visibility for the API, ingestion pipelines and creator attribution
                  service.
                </p>
                <div className="status-dot">
                  <i /> All 14 services operational
                </div>
                <div className="status-grid">
                  <div className="status-stat">
                    <div className="k">Uptime · 90d</div>
                    <div className="v">99.992%</div>
                  </div>
                  <div className="status-stat">
                    <div className="k">API p95</div>
                    <div className="v">
                      142<small>ms</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="side-card">
                <div className="eyebrow">Working hours</div>
                <h3>When we&rsquo;re on.</h3>
                <p style={{ marginBottom: 18 }}>
                  We&rsquo;re a distributed team across three continents — there&rsquo;s almost
                  always someone around to poke back.
                </p>
                <div className="mk-col" style={{ gap: 10, fontSize: 13 }}>
                  <div
                    className="mk-row"
                    style={{ justifyContent: 'space-between', color: 'var(--ink-2)' }}
                  >
                    <span>Paris &amp; London</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--ink-4)',
                        fontSize: 11,
                      }}
                    >
                      09:00 – 19:00 CET
                    </span>
                  </div>
                  <div
                    className="mk-row"
                    style={{ justifyContent: 'space-between', color: 'var(--ink-2)' }}
                  >
                    <span>New York</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--ink-4)',
                        fontSize: 11,
                      }}
                    >
                      09:00 – 18:00 ET
                    </span>
                  </div>
                  <div
                    className="mk-row"
                    style={{ justifyContent: 'space-between', color: 'var(--ink-2)' }}
                  >
                    <span>Mexico City</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--ink-4)',
                        fontSize: 11,
                      }}
                    >
                      10:00 – 18:00 CST
                    </span>
                  </div>
                  <div
                    className="mk-row"
                    style={{
                      justifyContent: 'space-between',
                      paddingTop: 10,
                      borderTop: '1px dashed var(--line-2)',
                      color: 'var(--ink-3)',
                    }}
                  >
                    <span>Overnight support</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--accent-ink)',
                        fontSize: 11,
                      }}
                    >
                      Studio plans only
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
