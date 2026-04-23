# Go-To-Market & Pricing Plan

**Status:** Proposal · decisions pending
**Drafted:** 2026-04-23

---

## 1. Honest assessment of where ShakeBase is today

**Product**

- Feature-complete for the brand workspace use case.
- Polish done on homepage, legal pages, analytics, tracking, admin catalog.
- No known blocking bug.

**Customers**

- One workspace (Casa Dragones, 260 cocktails seeded).
- Unclear whether it's a paying / production customer or a developer sandbox.
- No other acquisition channel active.

**Credibility debt — things the marketing claims that aren't true yet**

- **SOC 2 Type II** claimed across the homepage, pricing table, trust strip,
  and signup form footer. A SOC 2 Type II audit costs $30–80k and 12 months;
  realistically not done. → roadmap it ("Q4 2026") or remove.
- **POS sync** listed as a Studio plan feature. Not built. Already marked
  "Q4 2026" in the integrations roadmap — align the pricing table copy.
- **Bartender Free tier** on the pricing grid. The creator workspace feature
  isn't built (see `docs/creator-profiles-proposal.md`). Either remove or
  mark explicitly "Coming soon — join the waitlist".
- **"14-day trial, no credit card"** — this one is real, keep.
- **Case studies / testimonials** — zero. Every homepage brand ladder page
  says "trusted by" without naming a brand. Either get 3 real logos (even
  design partners at $0) or drop the section.

**Acquisition**

- No content / SEO program.
- No outbound.
- No paid.
- No referral / partner program.

Translation: every visitor today is organic curiosity or warm intro. That
isn't a channel.

---

## 2. Top 3 moves for the next 4 weeks

### Move 1 — Clean the remaining credibility debt (2-3 hours)

Once a prospect spots one false claim, they assume the rest. Fix everything
we can't defend with evidence:

- SOC 2: either "Q4 2026 on roadmap" or remove all mentions
- POS sync in pricing card: change to "POS sync (Q4 2026)"
- Bartender free tier: mark "Coming soon" or remove
- Trust strip: replace "SOC 2 Type II" with "EU data residency" or similar
  defensible claim
- Footer / signup: remove "SOC 2 Type II" badge until real

Zero cost, enormous insurance against a sceptical prospect.

### Move 2 — Outbound + Casa Dragones case study (3-4 weeks)

**Define ICP narrow:** trade marketing / brand ambassadors / creative
directors at **spirits brands under $50M revenue**. Tequila, mezcal,
craft gin, premium rum. They own cocktail canon but have it in Google
Sheets + PDFs scattered across reps.

**Write a 2-page case study** on Casa Dragones — even a light version.
"How Casa Dragones canonicalized 260 cocktails across the field team" with
concrete numbers (time saved, contributors, cocktail counts by season).
This is the warmest proof point we have; use it.

**Outbound plan:**

- LinkedIn Sales Navigator → 200 ICP contacts per batch
- 50 connection requests per week, 4 weeks = 200 reach
- Template: warm opener, one sentence on the pain, case study PDF, soft CTA
- Expected: 2-3% reply rate → 4-6 conversations → 1-2 signups / free
  workspaces in month 1

This validates or invalidates the ICP in 4 weeks. If 0 signups, the ICP is
wrong, not the product.

### Move 3 — Onboarding first-run (1 week)

A new user arrives on an empty dashboard today. That's the biggest leak.

Deliver:

- **Starter kit** optional one-click: pre-seed 5 classics (Margarita,
  Paloma, Old Fashioned, Negroni, Daiquiri) tagged `sample` so they can
  delete later
- **Clear empty state** on /cocktails with a big "Add your first cocktail"
  CTA and a 60-second tour
- **Get-started checklist** on /dashboard: "Add first cocktail · Invite a
  teammate · Connect a creator · Explore library" with progress
- **Time-to-first-cocktail metric** via the activity-tracking system — we
  already log `cocktail.create`, just query by user signup date

Without this, 60%+ of signups bounce before seeing value. Fix the funnel
before pouring outbound on top.

---

## 3. What NOT to do yet

- **Webhooks / API / Zapier** — not critical until 5+ customers ask. See
  `docs/integrations-roadmap.md` for the full plan when we're ready.
- **Creator marketplace** (creator profiles, public cocktails, Explore
  page) — see `docs/creator-profiles-proposal.md`. Pivot AFTER validating
  the brand ICP.
- **Paid ads** (Google / Meta) — no CAC data yet, no funnel converting
  consistently. Paid before organic = money on fire.
- **SOC 2 audit** — only trigger this when a prospect names it as a hard
  blocker in writing. It's $30-80k and 12 months; do it late.
- **Multi-language / multi-region push** — English + one region is plenty
  until $100k ARR.

---

## 4. Pricing restructure proposal

Current pricing (on homepage):

| Tier      | Price                        | Issue                                     |
|-----------|------------------------------|-------------------------------------------|
| Bartender | Free                         | Feature doesn't exist; promises vapor     |
| Studio    | €480 / venue / mo            | Price cliff from Free → Studio is huge    |
| Global    | Let's talk                   | Fine                                      |

The gap between Free and €480/mo is a missing-middle. Small brands, DTC
early-stage, single-bar programs, beverage consultants all fall into the
chasm. They'd pay €50-150/mo but won't commit €480.

### Proposed tiers

| Tier           | Price               | Target                                                   | Seats | Venues      | Cocktails    |
|----------------|---------------------|----------------------------------------------------------|-------|-------------|--------------|
| **Creator**    | Free (future)       | Bartender personal portfolio                             | 1     | —           | 20           |
| **Starter**    | €99 / mo            | Solo consultant, small brand, DTC early-stage, 1-venue program | 5     | 1           | 100          |
| **Studio**     | €399 / venue / mo   | Spirits brand, bar group with 2–25 venues                | unlim | included    | unlim        |
| **Enterprise** | Custom              | 25+ venues, custom domain, SOC 2, SSO, MSA red-lines     | unlim | unlim       | unlim        |

**Why:**

- **Starter €99** is the biggest opportunity. Captures consultants + small
  brands who today sign up, hit the paywall, and bounce. Low friction,
  predictable MRR stream.
- **Studio per-venue** aligns price with value: 3 venues = €1,200/mo,
  10 venues = €4,000/mo. Willingness-to-pay scales with venue footprint
  and we capture more of it.
- **Creator Free tier is parked** until the creator workspace feature ships
  (see `docs/creator-profiles-proposal.md`). Keep it off the pricing grid
  until then to avoid vapor-ware.
- **Enterprise stays "let's talk"** — useful lever for bespoke deals with
  the first 2-3 big customers. Once a pattern settles, add a real price.

### Transition plan

1. **Remove** the Bartender Free tier from the live pricing card.
2. **Add** the Starter €99 tier.
3. **Keep** Studio at €399-480/venue (test both — €480 is easy to round
   down from anchor).
4. **Update** the signup form: pick your tier at signup, Starter has a
   14-day trial like Studio.
5. Once Creator feature exists → put Bartender Free back.

### Honest pricing-page copy to add

- Change section sub from "Start free, upgrade when you're ready" to
  "14-day trial on Starter and Studio. No credit card needed."
- Under Studio: "Priced per venue because most of the value comes from
  standardising your canon across locations."
- Under Enterprise: "Typical Enterprise contracts start at €2,500/mo."
  (anchor price without committing to a SKU)

---

## 5. Milestone map

- **Week 1:** credibility cleanup + pricing restructure live on homepage
- **Week 2–4:** write case study, start outbound, ship onboarding
- **Week 4 checkpoint:** review outbound reply rate + signup rate. Decide:
  - If 1-2 signups and decent reply rate → double down on outbound, hire
    a part-time SDR later
  - If 0 signups and 0 replies → ICP is wrong, test another niche
    (cocktail consultants? independent bar groups? hotel beverage directors?)
- **Week 5-8:** ship webhooks + API (see integrations-roadmap.md) IF a
  paying customer has asked; otherwise content + SEO for organic funnel

---

## 6. Sanity check questions to answer before committing

- Is Casa Dragones paying? If yes, at what price? If no, is there a plan
  to convert?
- What's the closest competitor and how do they price? (Check
  RecipeIQ, Recipekeeper, BarKeeper, Backbar, etc.)
- Is there a specific geographic market you want to dominate first?
  (US spirits > EU spirits in sheer volume but EU has less competition)
- Who's the first person who said "I'd pay for this" — can we re-interview
  them and use their words in the case study?
