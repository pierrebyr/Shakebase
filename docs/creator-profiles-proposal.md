# Creator Profiles & Public Marketplace — Proposal

**Status:** Parked · not on roadmap yet
**Drafted:** 2026-04-23
**Scope:** Extend ShakeBase from a B2B SaaS for brands into a two-sided platform
where bartenders (creators) also have first-class workspaces + public profiles.

This is a strategic pivot, not a feature. Parking here for future reference.

---

## 1. What we want to build

Today `creators` is a per-workspace **data** table — when Casa Dragones types
"Yana Volfson", she exists as a row with no real-world account behind it. She
doesn't log in, doesn't control her bio, doesn't see where she's referenced.

The proposed extension lets bartenders:

- Create a **personal workspace** (`workspace.type = 'creator'`)
- Build a **canonical profile** that becomes the single source of truth for
  their identity, referenced from any brand workspace that cites them
- **Publish their cocktails publicly** — discoverable on `/explore`
- Get **recommended to brands** whose libraries overlap with their style

This shifts us to a marketplace. Brands pay more because the creator network
is the value. Creators get a free/freemium tier funded by brand spend.

## 2. Data-model changes

Minimum set:

```
workspaces.type              'brand' | 'creator'          -- discriminator
creator_profiles             id (= auth user.id),
                             slug, headline, verified,
                             public, avatar_url, bio, socials
creators.profile_id          FK nullable → creator_profiles
                             (links a local row to a canonical profile)
cocktails.visibility         'private' | 'unlisted' | 'public'
cocktails.origin_profile_id  FK → creator_profiles
                             (canonical author, independent of the workspace
                              the cocktail currently lives in)
```

Key invariant: a `creators` row can either stay as local text forever (current
behaviour, no regression) **or** point at a canonical `creator_profiles` row
via `profile_id`. Claim flow is additive.

## 3. UX surface

- **Bartender signup** — choose workspace type; `creator` auto-creates a
  workspace + a `creator_profiles` row with a reserved slug
  (`yana-volfson.shakebase.co` **or** `shakebase.co/@yana-volfson` — see
  open question below).
- **Claim flow** — when a bartender signs up, search existing `creators` rows
  by name across workspaces and offer to claim. On claim, brand workspaces get
  a notification and the canonical profile replaces the local text.
- **Publication toggle** — `private` (default) / `unlisted` / `public` per
  cocktail. Public ones surface on Explore.
- **/explore** — public, SSR, SEO-friendly. Filter by spirit, technique,
  creator. Opens a new acquisition funnel for brands ("find bartenders who
  work in agave highballs").
- **Brand discovery widget** — on the brand dashboard, "Creators you might
  like" based on matching spirit / category profiles.

## 4. Open questions (must answer before building)

- **Pricing model.** Creators won't pay $349/mo. Free or low freemium —
  whose economics carry the network? If brands, the brand plan price rises.
- **IP & attribution.** Bartender publishes a recipe, Casa Dragones imports
  it, bartender later joins Patrón. Who owns? Can import be revoked?
  **Must be codified in the TOS before PR 2 ships.**
- **Explore moderation.** Public publishing without moderation = spam, SEO
  abuse, image piracy. Minimum needed: signalement button + per-user rate
  limit on publication + manual review for flagged content.
- **Privacy on claim.** Casa Dragones has typed "Yana Volfson · 20 cocktails"
  for 2 years. When Yana claims the profile, does she see the historical
  attributions? Her data or theirs? Decide and document.
- **Subdomain strategy for creators.** `yana.shakebase.co` (cohérent mais
  10k subdomains si ça scale) vs `shakebase.co/@yana` (centralized,
  meilleur SEO). **Recommandation : le second pour creators**; réserver
  les subdomains pour les brands payantes.

## 5. Phased rollout (3 PRs)

### PR 1 — Canonical profiles + claim flow (2-3 weeks)

- Add `workspaces.type`, `creator_profiles`, `creators.profile_id`
- Bartender signup auto-creates workspace + profile
- Admin UI in brand workspace: "Link this creator to a ShakeBase profile"
  — searches, allows claim
- **No public surface yet.** Pure plumbing + enriched profile data.

Lowest risk, highest value. Invisible to current brand workspaces. Worth
doing first regardless of whether PR 2/3 ever ship.

### PR 2 — Publication + Explore (3-4 weeks)

- `cocktails.visibility` + UI toggle
- `/explore` public page, SEO-optimised, filters
- Public profile page `/@slug` showing published cocktails
- **Legal work required**: TOS update (IP, license), privacy review
- **Content moderation**: signalement button, rate-limit, manual review
  for flagged items

Blocked on legal + initial creator volume. Don't ship an empty Explore.

### PR 3 — Recommendation + brand discovery (2-3 weeks)

- Match brand library ↔ creator profiles (shared spirits, techniques)
- Brand dashboard widget "Creators you might like"
- Opt-in notifications when a brand references a creator

Premium-tier value-add. Only makes sense after Explore has volume.

## 6. Honest assessment

- **Do PR 1 now** if we want to future-proof the data model. It's cheap, it
  doesn't change anything visible for brands, and it makes future work
  easier. Worth doing even if PR 2/3 never ship.
- **Don't ship PR 2** until: (a) TOS updated by a lawyer, (b) 20-30
  bartenders committed to push initial content, (c) moderation tooling in
  place (at minimum: signalement flow + admin review queue).
- **PR 3 only makes sense after PR 2 has real volume.** Otherwise it
  recommends 2 creators nobody's heard of.

## 7. What changes if we do this

- **GTM flips**: from enterprise sales to creator acquisition + brand
  upsell. Different motion, different KPIs.
- **Pricing rebalances**: creator tier needs to be free or very cheap;
  brand tier needs to justify the network access.
- **Legal surface expands**: user-generated public content, DMCA, privacy
  on claim, TOS on recipe attribution.
- **Moderation becomes real work**: at least a few hours per week of
  review, especially in the first 6 months.
- **Network effects start mattering**: cold-start problem on both sides
  until you hit critical mass.

---

## Next decision point

Revisit this doc when:

- We've stabilised the brand product and have 5+ paying brand customers
- We have a clear answer to "how do we acquire 50 initial bartenders"
- We have bandwidth for the legal + moderation overhead PR 2 requires

Until then: park. Keep the data model flexible; avoid making anything about
`creators` or `cocktails.visibility` that would be painful to extend later.
