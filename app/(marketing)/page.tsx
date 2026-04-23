import Link from 'next/link'
import { MarketingNav } from './MarketingNav'
import { MarketingFooter } from './MarketingFooter'
import { Reveal } from '@/components/motion/Reveal'
import { Stagger } from '@/components/motion/Stagger'
import { CountUp } from '@/components/motion/CountUp'
import { Typewriter } from '@/components/motion/Typewriter'
import { FaqItem } from '@/components/motion/FaqItem'
import './marketing.css'

import type { Metadata } from 'next'

// Override the layout's %s template for the home page (full title, no suffix).
export const metadata: Metadata = {
  title: {
    absolute: 'ShakeBase — The Cocktail Canon for Brands and Bar Teams',
  },
  description:
    'Multi-tenant cocktail intelligence for spirits brands and bar groups. One canonical library for every recipe, creator, pour and specification.',
  alternates: { canonical: '/' },
}

export default function MarketingHome() {
  return (
    <div className="mk-scope">
      <MarketingNav />

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-bg" />
        <div className="wrap" style={{ padding: '0px 32px 150px' }}>
          <Stagger className="hero-inner" stagger={0.08} distance={18} amount={0.01}>
            <div className="hero-pill">
              <span className="tag">Free</span>
              <span>Bartenders get a free workspace — claim your handle</span>
            </div>
            <h1 className="hero-title">
              One shelf for every drink
              <br />
              <span className="it">your brand pours.</span>
            </h1>
            <p className="hero-sub">
              ShakeBase catalogues your signatures, your creators, and your recipes on a
              subdomain that&rsquo;s yours alone — so marketing, R&amp;D, and the bar speak one
              language.
            </p>
            <div className="hero-ctas">
              <Link className="mk-btn amber lg" href="/signup">
                Start free trial
              </Link>
              <Link className="mk-btn sec lg" href="/login">
                See it live →
              </Link>
            </div>
            <div className="hero-meta">
              <span>
                <b>14-day</b> free trial
              </span>
              <span>•</span>
              <span>
                <b>No credit card</b> required
              </span>
              <span>•</span>
              <span>
                Your workspace in <b>minutes</b>
              </span>
            </div>
          </Stagger>

          <Reveal className="hero-stage" from="right" distance={40} duration={0.8} delay={0.15} amount={0.01}>
            <div className="hero-shot">
              <div className="chrome">
                <div className="dots">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="addr">
                  <div className="lock-ico" />
                  <span>
                    <b>aurelia</b>.shakebase.co&nbsp;/&nbsp;library
                  </span>
                </div>
              </div>
              <div className="app-pane">
                <aside className="rail">
                  <div className="sec">Workspace</div>
                  <div className="ritem">
                    <span className="sq" />
                    Home
                  </div>
                  <div className="ritem on">
                    <span className="sq" />
                    Cocktail library
                  </div>
                  <div className="ritem">
                    <span className="sq" />
                    Ingredients
                  </div>
                  <div className="ritem">
                    <span className="sq" />
                    Creators
                  </div>
                  <div className="ritem">
                    <span className="sq" />
                    Analytics
                  </div>
                  <div className="sec">Brand</div>
                  <div className="ritem">
                    <span className="sq" />
                    Aurelia
                  </div>
                  <div className="ritem">
                    <span className="sq" />
                    Venues (7)
                  </div>
                </aside>
                <main className="app-main">
                  <div className="app-head">
                    <div>
                      <div
                        className="kicker"
                        style={{ color: 'var(--accent-ink)', marginBottom: 2 }}
                      >
                        — The library
                      </div>
                      <h2>24 signature cocktails.</h2>
                      <div className="sub">
                        Authored across 7 venues in 4 cities · 18 creators
                      </div>
                    </div>
                    <div
                      className="mk-row"
                      style={{ alignItems: 'center', gap: 6 }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '0.14em',
                          color: 'var(--ink-4)',
                          textTransform: 'uppercase',
                        }}
                      >
                        View
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          gap: 2,
                          padding: 2,
                          background: 'var(--bg-sunken)',
                          borderRadius: 7,
                        }}
                      >
                        <span
                          style={{
                            padding: '4px 8px',
                            background: '#fff',
                            borderRadius: 5,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--ink-1)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                          }}
                        >
                          Grid
                        </span>
                        <span
                          style={{
                            padding: '4px 8px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--ink-4)',
                          }}
                        >
                          List
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="app-filters">
                    <span className="chip on">All spirits</span>
                    <span className="chip">Tequila</span>
                    <span className="chip">Mezcal</span>
                    <span className="chip">Low-ABV</span>
                    <span className="chip">Signature</span>
                    <span className="chip">House</span>
                  </div>
                  <div className="cgrid">
                    {[
                      ['g1', 'Signature', 'Obsidian Paloma', 'Halsey Brenner · Aurelia'],
                      ['g2', 'New', 'Smoke Tithe', 'Mirela Sato · Kogane'],
                      ['g3', 'Menu', 'Petite Perle №4', 'Noa Cassar · Levanta'],
                      ['g4', 'R&D', 'Velour Margarita', 'Rafael Quiroga · Vestry'],
                    ].map(([g, tag, name, by]) => (
                      <div key={name} className="ccard">
                        <div className={`thumb ${g}`}>
                          <span className="tag">{tag}</span>
                        </div>
                        <div className="meta">
                          <div className="name">{name}</div>
                          <div className="by">{by}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </main>
              </div>
            </div>

            <div className="hero-float fl-analytics">
              <div className="lbl">This week · pours</div>
              <div className="val">4,812</div>
              <div className="delta">▲ 18.4% vs. last week</div>
              <div className="spark">
                {[38, 52, 46, 64, 58, 72, 82, 96].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="hero-float fl-creator">
              <div className="ava">H</div>
              <div className="who">Halsey Brenner</div>
              <div className="role">R&amp;D · Aurelia Bar</div>
              <div className="sig">— &ldquo;Obsidian Paloma&rdquo;</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* LOGOS — disabled until we have real customer logos + press placements */}
      {false && (
      <section className="logos wrap" style={{ marginTop: -100 }}>
        <div className="title">Trusted by world-class spirits brands and hospitality groups</div>
        <div className="logo-row">
          <div className="logo-mark italic">Maison Clair</div>
          <div className="logo-mark serif-caps">Aurelia</div>
          <div className="logo-mark serif-caps">Kogane</div>
          <div className="logo-mark">The Vestry</div>
          <div className="logo-mark italic">Levanta</div>
          <div className="logo-mark mono">PETITE/PERLE</div>
          <div className="logo-mark serif-caps">Botica</div>
        </div>
        <div className="press-strip">
          <div className="press-label">As featured in</div>
          <div className="press-row">
            <div
              className="press-mark"
              style={{
                fontFamily: 'var(--font-display)',
                fontVariant: 'small-caps',
                letterSpacing: '0.08em',
              }}
            >
              Punch
            </div>
            <div
              className="press-mark"
              style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
            >
              Imbibe
            </div>
            <div
              className="press-mark"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              Difford&rsquo;s Guide
            </div>
            <div
              className="press-mark"
              style={{
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                fontSize: 13,
              }}
            >
              THE&nbsp;DRINKS&nbsp;BUSINESS
            </div>
            <div
              className="press-mark"
              style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
            >
              Eater
            </div>
            <div
              className="press-mark"
              style={{
                fontFamily: 'var(--font-display)',
                fontVariant: 'small-caps',
                letterSpacing: '0.08em',
              }}
            >
              Wine Enthusiast
            </div>
          </div>
        </div>
      </section>
      )}

      {/* HOW IT WORKS */}
      <section className="section tight" id="how">
        <div className="wrap">
          <Stagger className="section-head center" stagger={0.08}>
            <div className="eyebrow">How it works</div>
            <h2 className="section-title">
              Your workspace, <span className="it">live in ninety seconds.</span>
            </h2>
            <p className="section-sub" style={{ marginInline: 'auto' }}>
              No implementation project, no multi-month rollout. Claim your subdomain, invite your
              team, import your cocktails.
            </p>
          </Stagger>
          <Stagger className="steps" stagger={0.12} distance={24}>
            <div className="step">
              <div className="step-num">01</div>
              <div className="step-ico">
                <span
                  className="mini-subdomain"
                  style={{
                    background: 'var(--bg-sunken)',
                    border: '1px solid var(--line-1)',
                    fontSize: 11,
                    width: '100%',
                  }}
                >
                  <span className="prot" style={{ color: 'var(--ink-4)' }}>
                    https://
                  </span>
                  <span className="sub" style={{ color: 'var(--accent-ink)' }}>
                    your-brand
                  </span>
                  <span className="rest" style={{ color: 'var(--ink-2)' }}>
                    .shakebase.co
                  </span>
                </span>
              </div>
              <h4>Claim your subdomain</h4>
              <p>
                Pick a workspace name — your brand or bar group. We spin up a dedicated tenant with
                its own database and subdomain in seconds.
              </p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <div className="step-ico">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {[
                    ['linear-gradient(135deg,#f5d9a9,#c49155)', 'E'],
                    ['linear-gradient(135deg,#b6d3bc,#5a7d62)', 'H'],
                    ['linear-gradient(135deg,#d8aecb,#8c5a7f)', 'M'],
                  ].map(([bg, letter], i) => (
                    <div
                      key={i}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: bg,
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontFamily: 'var(--font-display)',
                        fontStyle: 'italic',
                        fontSize: 16,
                        marginLeft: i === 0 ? 0 : -10,
                        border: '2px solid #fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      {letter}
                    </div>
                  ))}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#fff',
                      color: 'var(--ink-3)',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      marginLeft: -10,
                      border: '2px solid #fff',
                      boxShadow:
                        '0 1px 3px rgba(0,0,0,0.08), inset 0 0 0 1px var(--line-1)',
                    }}
                  >
                    +5
                  </div>
                </div>
              </div>
              <h4>Invite your team</h4>
              <p>
                Marketing, R&amp;D, and the bar — everyone on one workspace. Owner, editor, and
                viewer roles out of the box, with per-workspace access control.
              </p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <div className="step-ico">
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    'linear-gradient(135deg,#f4d7b9,#c49155)',
                    'linear-gradient(135deg,#e8dfc9,#8a7b5a)',
                    'linear-gradient(135deg,#d9c7b4,#a6623a)',
                    'linear-gradient(135deg,#f7e1d0,#c58268)',
                    'linear-gradient(135deg,#efe5d5,#b99b6d)',
                  ].map((bg, i) => (
                    <div
                      key={i}
                      style={{ width: 24, height: 24, borderRadius: 5, background: bg }}
                    />
                  ))}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: 'var(--bg-sunken)',
                      border: '1px dashed var(--line-1)',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--ink-4)',
                    }}
                  >
                    +
                  </div>
                </div>
              </div>
              <h4>Import your cocktails</h4>
              <p>
                Drop CSVs, paste from Notion, or let us migrate your legacy spec sheets. Free
                white-glove onboarding on every Studio plan.
              </p>
            </div>
          </Stagger>
        </div>
      </section>

      {/* STATS — disabled until real numbers */}
      {false && (
      <section className="stats">
        <div className="wrap stats-grid">
          <div className="stat">
            <div className="big">
              12.4k<span className="it">+</span>
            </div>
            <div className="lbl">Cocktails catalogued</div>
            <div className="desc">Signature, menu, and R&amp;D recipes across every workspace.</div>
          </div>
          <div className="stat">
            <div className="big">
              340<span className="it">.</span>
            </div>
            <div className="lbl">Venues live</div>
            <div className="desc">From Mexico City to Tokyo — each on its own subdomain.</div>
          </div>
          <div className="stat">
            <div className="big">2.1M</div>
            <div className="lbl">Pours / month</div>
            <div className="desc">Pour data synced from Toast, Lightspeed, and Revel POS.</div>
          </div>
          <div className="stat">
            <div className="big">
              +<span className="it">38</span>%
            </div>
            <div className="lbl">Signature velocity</div>
            <div className="desc">Average lift in signature cocktail pours within 90 days.</div>
          </div>
        </div>
      </section>
      )}

      {/* PRODUCT TOUR */}
      <section className="section" id="tour">
        <div className="wrap">
          <Stagger className="section-head center" stagger={0.08}>
            <div className="eyebrow">The Product</div>
            <h2 className="section-title">
              One place for every cocktail your <span className="it">brand pours.</span>
            </h2>
            <p className="section-sub" style={{ marginInline: 'auto' }}>
              From first R&amp;D sketch to flagship menu, ShakeBase keeps the canonical version of
              every recipe, creator, and spec — the single source of truth for marketing, R&amp;D,
              and the bar team.
            </p>
          </Stagger>

          {/* Tour 1 */}
          <div className="tour-row">
            <Reveal className="tour-copy" from="left" distance={32} duration={0.7}>
              <div className="num">Tour · 01 / 03</div>
              <h3>
                A <span className="it">living library</span> of every recipe you&rsquo;ve ever
                shipped.
              </h3>
              <p>
                Cocktails are first-class citizens — versioned, credited, and searchable across
                spirit base, glassware, ABV, cost, and venue. Filter, annotate, and export to
                print-ready spec cards in seconds.
              </p>
              <ul>
                <li>Filter by base spirit, glassware, flavour, ABV, cost, creator, venue.</li>
                <li>Version history — see every edit and who made it.</li>
                <li>Export menu PDFs and POS-ready spec sheets.</li>
              </ul>
            </Reveal>
            <Reveal className="tour-mock" from="right" distance={32} duration={0.7} delay={0.15}>
              <div className="mk-library">
                <div className="hd">
                  <h4>— The library</h4>
                  <span className="meta">24 cocktails · 7 venues</span>
                </div>
                <div className="chips">
                  <span className="c on">All</span>
                  <span className="c">Tequila</span>
                  <span className="c">Mezcal</span>
                  <span className="c">Signature</span>
                  <span className="c">Low-ABV</span>
                </div>
                <div className="grid">
                  {[
                    ['g1', 'Obsidian Paloma'],
                    ['g2', 'Smoke Tithe'],
                    ['g3', 'Petite Perle'],
                    ['g4', 'Velour Margarita'],
                    ['g5', 'Midnight Oath'],
                    ['g6', 'Agave Vesper'],
                    ['g7', 'Solar Negroni'],
                    ['g8', 'Kogane Spritz'],
                  ].map(([g, name]) => (
                    <div key={name} className="it">
                      <div className={`th ${g}`} />
                      <div className="nm">{name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Tour 2 */}
          <div className="tour-row flip">
            <Reveal className="tour-mock" from="left" distance={32} duration={0.7}>
              <div className="mk-detail">
                <div className="art">
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      opacity: 0.75,
                      textTransform: 'uppercase',
                    }}
                  >
                    Signature · Aurelia
                  </div>
                  <div>
                    <div className="nm">Obsidian Paloma</div>
                    <div
                      style={{
                        marginTop: 10,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        opacity: 0.75,
                      }}
                    >
                      by Halsey Brenner · Aurelia Bar
                    </div>
                  </div>
                </div>
                <div className="body">
                  <div className="mk-meta">
                    <div>
                      <span className="k">Glass</span>
                      <span className="v">Highball</span>
                    </div>
                    <div>
                      <span className="k">ABV</span>
                      <span className="v">18.4%</span>
                    </div>
                    <div>
                      <span className="k">Pour cost</span>
                      <span className="v">€2.80</span>
                    </div>
                  </div>
                  <div className="lbl">Build — 5 ingredients</div>
                  {[
                    ['Aurelia Joven', '60 ml'],
                    ['Lime juice', '20 ml'],
                    ['Grapefruit cordial', '15 ml'],
                    ['Ancho chile salt', 'rim'],
                    ['Grapefruit soda', 'top'],
                  ].map(([name, amt]) => (
                    <div key={name} className="ing">
                      <b>{name}</b>
                      <span>{amt}</span>
                    </div>
                  ))}
                  <div className="lbl" style={{ marginTop: 14 }}>
                    Method
                  </div>
                  <div className="mk-steps">
                    <div data-n="1">Rim highball with ancho salt.</div>
                    <div data-n="2">Shake joven, lime, cordial over ice.</div>
                    <div data-n="3">Strain, top with soda, grapefruit peel.</div>
                  </div>
                  <div className="mk-tags">
                    <span>Smoky</span>
                    <span>Citrus</span>
                    <span>Spicy</span>
                    <span>Long</span>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal className="tour-copy" from="right" distance={32} duration={0.7} delay={0.15}>
              <div className="num">Tour · 02 / 03</div>
              <h3>
                Recipes that <span className="it">carry their story</span> with them.
              </h3>
              <p>
                Every cocktail has a creator, a venue, a signature, and a visual identity baked in.
                When a bartender moves, their recipes move too — with full attribution and full
                provenance.
              </p>
              <ul>
                <li>Structured ingredients with units, brands, and cost pulled in automatically.</li>
                <li>Glassware, garnish, ice format, dilution target — all captured.</li>
                <li>Flavour wheel, pairing notes, menu copy, and press-ready imagery.</li>
              </ul>
            </Reveal>
          </div>

          {/* Tour 3 */}
          <div className="tour-row">
            <Reveal className="tour-copy" from="left" distance={32} duration={0.7}>
              <div className="num">Tour · 03 / 03</div>
              <h3>
                Pour data, <span className="it">turned into brand strategy.</span>
              </h3>
              <p>
                The analytics your brand team already wants — library health, creator
                contribution, ingredient mix, menu pipeline — packaged so marketing and R&amp;D
                actually use it. Pour-level POS sync is on the roadmap.
              </p>
              <ul>
                <li>Live metrics: creators, ingredients, flavor profile, price spread.</li>
                <li>Attribution by cocktail → creator → venue — from day one.</li>
                <li>
                  POS sync (Toast Q4 2026 · Lightspeed on request) layers pour volumes on top
                  when you&rsquo;re ready.
                </li>
              </ul>
            </Reveal>
            <Reveal className="tour-mock" from="right" distance={32} duration={0.7} delay={0.15}>
              <div className="mk-analytics">
                <div className="top">
                  <div className="kpi">
                    <div className="l">Pours · 30d</div>
                    <div className="v">
                      <CountUp to={128.4} duration={1.4} decimals={1} suffix="k" />
                    </div>
                    <div className="d">▲ 18.4%</div>
                  </div>
                  <div className="kpi">
                    <div className="l">Signature share</div>
                    <div className="v">
                      <CountUp to={42} duration={1.2} suffix="%" />
                    </div>
                    <div className="d">▲ 6.2 pts</div>
                  </div>
                  <div className="kpi">
                    <div className="l">Avg. cost / pour</div>
                    <div className="v">
                      <CountUp to={2.8} duration={1.2} decimals={2} prefix="€" />
                    </div>
                    <div className="d">▼ 4%</div>
                  </div>
                </div>
                <div className="chart">
                  <div className="chart-title">Pours by week — Aurelia</div>
                  <div className="leg">LAST 12 WK</div>
                  <div className="yaxis">
                    <span>15k</span>
                    <span>10k</span>
                    <span>5k</span>
                    <span>0</span>
                  </div>
                  <div className="chgrid">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <div
                    className="avg-line"
                    style={{ top: 'calc(38px + (100% - 64px) * 0.36)' }}
                  />
                  <div className="bars">
                    {[42, 54, 48, 62, 58, 70, 66, 78, 72, 84, 90].map((h, i) => (
                      <i key={i} className="b" style={{ height: `${h}%` }} />
                    ))}
                    <i className="b last" style={{ height: '96%' }} />
                  </div>
                  <div className="xaxis">
                    <span>W1</span>
                    <span>W3</span>
                    <span>W5</span>
                    <span>W7</span>
                    <span>W9</span>
                    <span>W12</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* BENTO */}
      <section
        className="section tight-bottom"
        id="product"
        style={{ background: 'var(--bg-sunken)' }}
      >
        <div className="wrap">
          <Stagger className="section-head" stagger={0.08}>
            <div className="eyebrow">What&rsquo;s inside</div>
            <h2 className="section-title">
              Built for a <span className="it">global brand team.</span>
            </h2>
            <p className="section-sub">
              Nine modules, one workspace. Ship menus faster, coordinate R&amp;D across cities, and
              tell a tighter brand story — with the receipts.
            </p>
          </Stagger>
          {/* Bento tiles use grid-column: span N — can't wrap each in a motion
              div without breaking the grid. Keep plain; each tile reveals via
              its own hover-lift instead. */}
          <div className="bento">
            <div className="tile tile-dark t-full">
              <div className="tile-hero">
                <div className="tile-hero-copy">
                  <div className="tlbl">Multi-tenant</div>
                  <h4>
                    Every brand on its own <span className="it">dedicated workspace.</span>
                  </h4>
                  <p>
                    Your team signs in at your subdomain. Your data stays isolated via
                    per-workspace row-level security. Custom domains and SSO are available on
                    Enterprise contracts.
                  </p>
                </div>
                <div className="tile-hero-visual">
                  <div className="mini-subdomain">
                    <span className="prot">https://</span>
                    <span className="sub">
                      <Typewriter text="aurelia" speedMs={80} startDelay={0.3} caret={false} />
                    </span>
                    <span className="rest">.shakebase.co</span>
                    <span className="pulse" />
                  </div>
                  <div className="tile-hero-meta">
                    <span>Row-level isolation</span>
                    <span>•</span>
                    <span>Custom domain (Enterprise)</span>
                    <span>•</span>
                    <span>Per-workspace retention</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tile t-mid">
              <div>
                <div className="tlbl">Ingredients graph</div>
                <h4>
                  A <span className="it">connected graph</span> of spirits, modifiers, syrups.
                </h4>
                <p>
                  Every cocktail uses structured ingredients. Rename a product and it updates
                  everywhere — with brand, cost, and stock flowing through.
                </p>
              </div>
              <div className="mini-pills">
                <span className="p">Tequila</span>
                <span className="p">Mezcal</span>
                <span className="p">Agave syrup</span>
                <span className="p">Lime</span>
                <span className="p">Verjus</span>
              </div>
            </div>

            <div className="tile t-mid">
              <div>
                <div className="tlbl">Creators</div>
                <h4>
                  A rich <span className="it">creator profile</span> for every bartender.
                </h4>
                <p>
                  Photo, bio, signatures, contributions, current venue. When bartenders move, their
                  attribution comes with them — automatically.
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  border: '1px solid var(--line-1)',
                  borderRadius: 12,
                  background: '#fcfbf7',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#f5d9a9,#c49155)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  H
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    className="mini-signature"
                    style={{ fontSize: 26, lineHeight: 1.05 }}
                  >
                    Halsey Brenner
                  </div>
                  <small
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      marginTop: 6,
                    }}
                  >
                    4 signatures · Aurelia Bar
                  </small>
                </div>
              </div>
            </div>

            <div className="tile t-wide">
              <div>
                <div className="tlbl">Cost &amp; margin</div>
                <h4>
                  Know your <span className="it">pour cost</span> before the bottle ever opens.
                </h4>
                <p>
                  ShakeBase calculates per-serve cost, menu price, and gross margin from live
                  ingredient pricing. Flag cocktails that slip below your margin floor.
                </p>
              </div>
              <div className="cost-ticket">
                <div className="cost-ticket-head">
                  <div>
                    <div className="mlbl">Menu price · Obsidian Paloma</div>
                    <div className="cost-ticket-price">€14.00</div>
                  </div>
                  <div className="cost-ticket-gm">
                    <span className="mlbl">Gross margin</span>
                    <span className="cost-ticket-gm-val">78%</span>
                  </div>
                </div>
                <div className="cost-ticket-bar">
                  <span className="cost-part cost" style={{ flex: 20 }}>
                    <b>€2.80</b>
                    <small>Pour cost</small>
                  </span>
                  <span className="cost-part margin" style={{ flex: 80 }}>
                    <b>€11.20</b>
                    <small>Margin</small>
                  </span>
                </div>
                <div className="cost-ticket-foot">
                  <span>
                    Floor <b>€4.00</b>
                  </span>
                  <span className="ok-tag">▲ €1.20 clear</span>
                </div>
              </div>
            </div>

            <div className="tile t-sm">
              <div>
                <div className="tlbl">POS sync</div>
                <h4>
                  Live <span className="it">pour data</span> from the bar.
                </h4>
              </div>
              <div className="mini-pos">
                <div className="mini-pos-head">
                  <div>
                    <div className="mini-pos-stat">128.4k</div>
                    <div className="mini-pos-sub">Pours · last 30d</div>
                  </div>
                  <div className="mini-pos-delta">▲ 18.4%</div>
                </div>
                <div className="mini-bars">
                  {[35, 48, 42, 66, 58, 72, 80, 92].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mini-pos-axis">
                  <span>W1</span>
                  <span>W4</span>
                  <span>W8</span>
                </div>
                <div className="mini-pos-foot">
                  <span className="dot" /> Live · Toast
                  <span className="mut">15 min lag</span>
                </div>
              </div>
            </div>

            <div className="tile t-sm">
              <div>
                <div className="tlbl">Print-ready</div>
                <h4>
                  One-click <span className="it">menu exports.</span>
                </h4>
                <p>PDF, POS, press kits.</p>
              </div>
              <div
                style={{
                  padding: 16,
                  background: '#fff',
                  border: '1px solid var(--line-1)',
                  borderRadius: 8,
                  width: '100%',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 16,
                    textAlign: 'center',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Spring Menu 2026
                </div>
                <div style={{ borderTop: '1px solid var(--line-2)', margin: '8px 0' }} />
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Obsidian Paloma</span>
                  <span>14€</span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 4,
                  }}
                >
                  <span>Velour Margarita</span>
                  <span>15€</span>
                </div>
              </div>
            </div>

            <div className="tile t-sm" style={{ justifyContent: 'flex-start', gap: 16 }}>
              <div>
                <div className="tlbl">Collaboration</div>
                <h4>
                  R&amp;D with <span className="it">comments &amp; review.</span>
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#b6d3bc,#5a7d62)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    H
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--ink-2)',
                        lineHeight: 1.35,
                      }}
                    >
                      <b style={{ color: 'var(--ink-1)', fontWeight: 500 }}>Halsey</b> · drop the
                      verjus? Too tart w/ the Blanco.
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    paddingLeft: 30,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#f5d9a9,#c49155)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    E
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--ink-3)',
                        lineHeight: 1.35,
                      }}
                    >
                      Swap for lime cordial ✓
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 6,
                    borderTop: '1px dashed var(--line-2)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9.5,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-4)',
                  }}
                >
                  <span>3 open · 12 resolved</span>
                  <span style={{ color: 'var(--accent-ink)' }}>@mention</span>
                </div>
              </div>
            </div>

            <div className="tile t-sm">
              <div>
                <div className="tlbl">Permissions</div>
                <h4>
                  Role-based <span className="it">access, per market.</span>
                </h4>
                <p>Brand leads, bar managers, local teams.</p>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                }}
              >
                {[
                  ['Brand lead', 'All markets', 'var(--accent-ink)'],
                  ['Bar manager', 'NYC · Paris', 'var(--ink-4)'],
                  ['Bartender', 'Aurelia Bar', 'var(--ink-4)'],
                ].map(([role, scope, color]) => (
                  <div
                    key={role}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      border: '1px solid var(--line-1)',
                      borderRadius: 6,
                      background: '#fcfbf7',
                    }}
                  >
                    <span style={{ color: 'var(--ink-2)' }}>{role}</span>
                    <span
                      style={{
                        color,
                        textTransform: 'uppercase',
                        fontSize: 9,
                        letterSpacing: '0.12em',
                      }}
                    >
                      {scope}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="changelog" style={{ marginTop: 14 }}>
            <span className="badge">New</span>
            <div className="txt">
              <b>Team activity tracking</b> · Workspace owners can now see who&rsquo;s
              viewing, searching, and editing across their library — live in every workspace.
            </div>
            <span className="date">APR 2026</span>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL — disabled until a real customer quote is published with consent */}
      {false && (
      <section className="section quote-section" id="customers">
        <div className="wrap">
          <div className="quote-layout">
            <div>
              <div className="quote-mark">&ldquo;</div>
              <p className="quote-body">
                Our signature cocktails used to live in{' '}
                <em>seven different Notion docs</em>. Now our entire canon — 340 venues, 12,000
                pours a night — sits on one subdomain.
              </p>
              <div className="quote-attr">
                <div className="ava">B</div>
                <div>
                  <div className="name">Blanca Ramírez</div>
                  <div className="role">Chief Marketing Officer · Aurelia</div>
                </div>
              </div>
            </div>
            <aside className="quote-side">
              <div className="cd-mark">Aurelia</div>
              <div className="cd-sub">Customer since 2024</div>
              <div className="quote-stats">
                <div className="quote-stat">
                  <div className="k">Venues live</div>
                  <div className="v">
                    340<small>▲ 112 in 18mo</small>
                  </div>
                </div>
                <div className="quote-stat">
                  <div className="k">Nightly pours</div>
                  <div className="v">
                    12k<small>▲ 38% YoY</small>
                  </div>
                </div>
                <div className="quote-stat">
                  <div className="k">Notion docs retired</div>
                  <div className="v">
                    7<small>Down to 1 source</small>
                  </div>
                </div>
                <div className="quote-stat">
                  <div className="k">Menu ship time</div>
                  <div className="v">
                    3d<small>▼ from 5 weeks</small>
                  </div>
                </div>
              </div>
              <a className="quote-cta" href="#">
                Read the full case study
                <span>→</span>
              </a>
            </aside>
          </div>
        </div>
      </section>
      )}

      {/* INTEGRATIONS */}
      <section className="section tight">
        <div className="wrap">
          <Stagger className="section-head center" stagger={0.08}>
            <div className="eyebrow">Integrations</div>
            <h2 className="section-title">
              Built to <span className="it">plug in.</span>
            </h2>
            <p className="section-sub" style={{ marginInline: 'auto' }}>
              A clean REST API and outbound webhooks are on the near roadmap — so ShakeBase fits
              around the stack your team already uses, from POS to Slack to whatever you&rsquo;ll
              adopt next.
            </p>
          </Stagger>
          <Stagger className="integ-grid" stagger={0.04} distance={14}>
            {[
              ['#1a1918', '⁂', 'Webhooks', 'Q2 2026'],
              ['#c49155', '+', 'REST API', 'Q2 2026'],
              ['#ff4a00', 'Z', 'Zapier', 'Q2 2026'],
              ['#4A154B', 'S', 'Slack', 'Q3 2026'],
              ['#ff4e2b', 'T', 'Toast POS', 'Q4 2026'],
              ['#e41e2d', 'L', 'Lightspeed', 'On request'],
            ].map(([bg, mark, name, eta]) => (
              <div key={name} className="integ-cell">
                <div className="logo" style={{ background: bg }}>
                  {mark}
                </div>
                <div className="nm">{name}</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    color: 'var(--ink-4)',
                    letterSpacing: '0.08em',
                    marginTop: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  {eta}
                </div>
              </div>
            ))}
          </Stagger>
          <p
            style={{
              marginTop: 24,
              textAlign: 'center',
              fontSize: 12.5,
              color: 'var(--ink-4)',
              maxWidth: '52ch',
              marginInline: 'auto',
            }}
          >
            Once Zapier ships you get one-click connections to 6,000+ other apps — Notion,
            Airtable, Sheets, Gmail, Teams, Discord and the rest. Need something sooner?{' '}
            <a href="/contact?topic=integrations">Tell us</a>.
          </p>
        </div>
      </section>

      {/* SECURITY */}
      <section className="section tight" style={{ background: 'var(--bg-sunken)' }}>
        <div className="wrap">
          <Stagger className="section-head center" stagger={0.08}>
            <div className="eyebrow">Security</div>
            <h2 className="section-title">
              Your brand canon, <span className="it">locked tight.</span>
            </h2>
            <p className="section-sub" style={{ marginInline: 'auto' }}>
              Every workspace is isolated at the database level. Your recipes are treated like the
              IP they are.
            </p>
          </Stagger>
          {/* Plain grid — direct children stretch to equal row height. */}
          <div className="sec-grid">
            <div className="sec-card">
              <div className="badge">RLS</div>
              <h3>Per-workspace isolation</h3>
              <p>
                Every tenant table is protected by Postgres row-level security. Access policies
                enforce that a workspace only sees its own cocktails, creators, products, and
                activity — zero cross-tenant leakage by design.
              </p>
            </div>
            <div className="sec-card">
              <div className="badge">GDPR</div>
              <h3>GDPR-aligned</h3>
              <p>
                DPA on request, per-workspace retention controls on activity logs
                (90-day rolling), and one-click data export on account termination. Hosted on
                Vercel + Supabase, both SOC 2 Type II sub-processors.
              </p>
            </div>
            <div className="sec-card">
              <div className="badge">TLS · AES</div>
              <h3>Encrypted end-to-end</h3>
              <p>
                TLS 1.3 in transit, AES-256 at rest (via Supabase), daily encrypted backups
                with 30-day retention, and server-side-only secrets. Full details on our{' '}
                <a href="/security">Security</a> page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="wrap">
          <Stagger className="section-head center" stagger={0.08}>
            <div className="eyebrow">Pricing</div>
            <h2 className="section-title">
              Free for bartenders. <span className="it">Priced by venue for brands.</span>
            </h2>
            <p className="section-sub" style={{ marginInline: 'auto' }}>
              Creators get a forever-free workspace. Brands start on a 14-day trial with no
              credit card.
            </p>
          </Stagger>
          {/* Plain grid — plans stretch to equal row height. */}
          <div className="price-grid">
            <div className="plan">
              <div>
                <div className="plan-tag">Bartender</div>
                <div className="plan-name">Creator</div>
              </div>
              <div className="plan-price">
                <span className="amt">Free</span>
                <span className="per">forever</span>
              </div>
              <div className="plan-desc">
                For independent bartenders and consultants building a personal cocktail library.
              </div>
              <ul className="plan-feats">
                <li>Up to 25 cocktails</li>
                <li>1 seat (you)</li>
                <li>Personal subdomain</li>
                <li>Access to the shared ingredient catalogue</li>
                <li>Community support</li>
              </ul>
              <Link
                href="/signup"
                className="mk-btn sec lg"
                style={{ justifyContent: 'center' }}
              >
                Claim your handle
              </Link>
            </div>

            <div className="plan">
              <div>
                <div className="plan-tag">Small brand · consultant</div>
                <div className="plan-name">Starter</div>
              </div>
              <div className="plan-price">
                <span className="amt">$99</span>
                <span className="per">/ month</span>
              </div>
              <div className="plan-desc">
                For DTC spirits brands, single-venue programs, and beverage consultants with
                clients.
              </div>
              <ul className="plan-feats">
                <li>Up to 200 cocktails</li>
                <li>1 venue, 5 seats</li>
                <li>Dedicated workspace subdomain</li>
                <li>Library + team analytics</li>
                <li>Email support</li>
              </ul>
              <Link
                href="/signup"
                className="mk-btn sec lg"
                style={{ justifyContent: 'center' }}
              >
                Start 14-day trial
              </Link>
            </div>

            <div className="plan featured">
              <div>
                <div className="plan-tag">Most brands pick this</div>
                <div className="plan-name">Studio</div>
              </div>
              <div className="plan-price">
                <span className="amt">$399</span>
                <span className="per">/ venue / month</span>
              </div>
              <div className="plan-desc">
                For spirits brands and bar groups with multiple venues, creators, and a full
                R&amp;D pipeline.
              </div>
              <ul className="plan-feats">
                <li>Unlimited cocktails &amp; creators</li>
                <li>Up to 25 venues, unlimited seats</li>
                <li>Dedicated workspace subdomain</li>
                <li>Full analytics + team activity tracking</li>
                <li>POS sync (Toast Q4 2026)</li>
                <li>Priority support</li>
              </ul>
              <Link
                href="/signup"
                className="mk-btn amber lg"
                style={{ justifyContent: 'center' }}
              >
                Start 14-day trial
              </Link>
            </div>

          </div>

          {/* Enterprise — set apart from the 3 self-serve tiers */}
          <div className="price-enterprise">
            <div>
              <div className="ent-tag">Enterprise · Global</div>
              <div className="ent-title">
                25+ venues? <span>Let&rsquo;s talk.</span>
              </div>
            </div>
            <div>
              <p className="ent-desc">
                For spirits groups and hospitality brands that need custom domains,
                SSO, procurement red-lines, and a dedicated success team.
              </p>
              <ul className="ent-feats">
                <li>Unlimited venues</li>
                <li>
                  Custom domain (<code style={{ fontSize: 11 }}>recipes.yourbrand.com</code>)
                </li>
                <li>SSO (Google, Okta, Azure AD)</li>
                <li>Dedicated success team</li>
                <li>Custom SLA + audit log retention</li>
                <li>Priority integration work</li>
              </ul>
            </div>
            <Link href="/contact" className="mk-btn amber lg">
              Talk to sales →
            </Link>
          </div>

          <p
            style={{
              marginTop: 20,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--ink-4)',
              maxWidth: '56ch',
              marginInline: 'auto',
            }}
          >
            All paid tiers billed in USD. EUR/GBP billing available for Enterprise.
          </p>
        </div>
      </section>

      {/* DEVELOPERS */}
      <section className="section tight dev-section" id="developers">
        <div className="wrap">
          <div className="dev-layout">
            <Reveal from="left" distance={28} duration={0.7}>
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>
                For developers
              </div>
              <h2 className="section-title" style={{ color: '#fff' }}>
                The cocktail API you{' '}
                <span className="it" style={{ color: 'var(--accent)' }}>
                  always wanted.
                </span>
              </h2>
              <p className="section-sub" style={{ color: 'rgba(255,255,255,0.7)' }}>
                REST + GraphQL access to your whole workspace. Webhooks for pours, approvals, and
                inventory events. Every endpoint rate-limit-aware and fully typed.
              </p>
              <div
                className="hero-ctas"
                style={{ justifyContent: 'flex-start', marginTop: 28 }}
              >
                <a className="mk-btn amber lg" href="#">
                  Read the docs →
                </a>
                <a
                  className="mk-btn sec lg"
                  href="#"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.15)',
                  }}
                >
                  Get an API key
                </a>
              </div>
            </Reveal>
            <Reveal className="dev-code" from="right" distance={28} duration={0.7} delay={0.15}>
              <div className="comment">
                <Typewriter
                  text="$ curl https://aurelia.shakebase.co/api/v1/cocktails"
                  speedMs={18}
                  startDelay={0.4}
                />
              </div>
              <pre>
{`{
  `}<span className="k">&quot;id&quot;</span>{`: `}<span className="s">&quot;ckt_obsidian-paloma&quot;</span>{`,
  `}<span className="k">&quot;name&quot;</span>{`: `}<span className="s">&quot;Obsidian Paloma&quot;</span>{`,
  `}<span className="k">&quot;creator&quot;</span>{`: `}<span className="s">&quot;Halsey Brenner&quot;</span>{`,
  `}<span className="k">&quot;venue&quot;</span>{`: `}<span className="s">&quot;Aurelia Bar&quot;</span>{`,
  `}<span className="k">&quot;base_spirit&quot;</span>{`: `}<span className="s">&quot;tequila&quot;</span>{`,
  `}<span className="k">&quot;abv&quot;</span>{`: `}<span className="n">18.4</span>{`,
  `}<span className="k">&quot;cost_eur&quot;</span>{`: `}<span className="n">2.80</span>{`,
  `}<span className="k">&quot;pours_30d&quot;</span>{`: `}<span className="n">4812</span>{`
}`}
              </pre>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section tight">
        <div className="wrap">
          <Stagger className="section-head center" stagger={0.08}>
            <div className="eyebrow">FAQ</div>
            <h2 className="section-title">
              Common <span className="it">questions.</span>
            </h2>
          </Stagger>
          <Stagger className="faq-list" stagger={0.06} distance={12}>
            {[
              {
                q: 'What exactly is "a workspace" on ShakeBase?',
                a: 'Every customer — a spirits brand, hospitality group, or independent bartender — gets a dedicated workspace at their own subdomain (e.g. aurelia.shakebase.co). Data, users, branding, and retention are isolated per workspace via Postgres row-level security. Enterprise customers can bring their own domain.',
                open: true,
              },
              {
                q: 'Do you pull in live pour data from our POS?',
                a: 'Not yet. A Toast POS integration is on the roadmap for Q4 2026, with Lightspeed close behind. Once live, pour data flows in every 15 minutes and is attributed down to cocktail, creator, and venue. In the meantime, the REST API + webhooks we ship in Q2 2026 let you push data from any POS — and a Zapier app will cover the long tail.',
              },
              {
                q: 'Who owns the recipes?',
                a: 'You do — always. Your recipes, your creator profiles, your attribution. ShakeBase never uses your canon to train public models or expose it to other workspaces. Export everything in JSON, CSV, or PDF anytime.',
              },
              {
                q: "How is a creator's attribution handled if they change venues?",
                a: 'Creators are first-class entities. When a bartender moves between venues within the same workspace, their signature cocktails follow them — with the original venue retained in the recipe history. A canonical cross-workspace creator profile (with public portfolio + discovery) is on the roadmap.',
              },
              {
                q: 'Is ShakeBase SOC 2 or ISO certified?',
                a: "Not yet — ShakeBase itself is pre-certification. Our infrastructure sub-processors (Vercel and Supabase) are both SOC 2 Type II, so your data at rest and in transit benefits from their controls. We're happy to share our Data Processing Addendum on request. A ShakeBase-level SOC 2 audit is on the roadmap once we pass the revenue threshold where it's required.",
              },
              {
                q: 'Can I try it with my team before we commit?',
                a: "Yes. Bartenders get a forever-free personal workspace. Brands start with a 14-day free trial on Starter or Studio — no credit card required. You get a dedicated subdomain and your full team to evaluate with real cocktails.",
              },
            ].map(({ q, a, open }) => (
              <FaqItem key={q} className="faq-item" question={q} defaultOpen={open}>
                <div className="faq-a">{a}</div>
              </FaqItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CAREERS — disabled until real roles are open */}
      {false && (
      <section className="section tight careers-band">
        <div className="wrap">
          <div className="careers-strip">
            <div className="careers-left">
              <div className="eyebrow">Careers</div>
              <h3 className="careers-title">
                Building the <span className="it">quiet infrastructure</span> of a louder
                industry.
              </h3>
            </div>
            <div className="careers-mid">
              <ul className="careers-roles">
                <li>
                  <span className="cr-role">Senior Product Designer</span>
                  <span className="cr-loc">Paris · Hybrid</span>
                </li>
                <li>
                  <span className="cr-role">Staff Engineer, Ingredients</span>
                  <span className="cr-loc">Remote · EU</span>
                </li>
                <li>
                  <span className="cr-role">Brand Lead, Spirits</span>
                  <span className="cr-loc">Mexico City</span>
                </li>
                <li className="cr-more">
                  <span>+ 4 more roles</span>
                </li>
              </ul>
            </div>
            <div className="careers-right">
              <a className="mk-btn sec" href="#">
                See all roles →
              </a>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* CTA */}
      <section className="cta-band" id="cta">
        <Stagger className="wrap" stagger={0.1} distance={20}>
          <h2>
            Your brand&rsquo;s cocktails
            <br />
            <span className="it">deserve a canon.</span>
          </h2>
          <p>
            Stand up your ShakeBase workspace in 90 seconds. 14-day free trial, no credit card,
            real subdomain from minute one.
          </p>
          <div className="hero-ctas">
            <Link className="mk-btn amber lg" href="/signup">
              Start free trial →
            </Link>
            <Link className="mk-btn sec lg" href="/login">
              See a live workspace
            </Link>
          </div>
          <div className="hero-meta" style={{ marginTop: 24 }}>
            <span>No credit card</span>
            <span>•</span>
            <span>Your workspace in minutes</span>
            <span>•</span>
            <span>Free forever for bartenders</span>
          </div>
        </Stagger>
      </section>

      <MarketingFooter />
    </div>
  )
}
