# ShakeBase — Complete Overview

**Last updated:** 2026-04-23
**Purpose:** Single orientation doc. If you're picking up the project cold,
read this first. Deeper technical detail lives in `ARCHITECTURE.md`;
parked product directions live in `docs/*.md`.

---

## 1. TL;DR

ShakeBase is a multi-tenant SaaS cocktail library. Each customer — a
spirits brand, a bar group, or an independent bartender — gets a workspace
on its own subdomain and uses it to catalogue cocktails, ingredients,
products, and creators. The underlying bet: cocktail IP inside brands and
hospitality groups today lives in scattered Google Sheets, PDFs, and
people's heads, and ShakeBase makes it a single shelf.

**Today:** production is feature-complete for the brand / bar-group use
case. One workspace (Casa Dragones) is seeded as a friends-of-the-house
complimentary tenant — **not** a paying customer or a case study. No paid
customers yet. US-first positioning.

**Stack:** Next.js 15 App Router + React 19 + Supabase (Postgres + Auth +
Storage) + Stripe + Resend + Upstash Redis, deployed on Vercel.

---

## 2. Three surfaces, one codebase

One Next.js deploy serves three audiences, routed by subdomain via
`middleware.ts`:

| Subdomain                     | Audience                  | Route group     |
|-------------------------------|---------------------------|-----------------|
| `shakebase.co` / `www`        | Prospects                 | `app/(marketing)` |
| `<slug>.shakebase.co`         | Workspace members         | `app/(tenant)`    |
| `admin.shakebase.co`          | Super-admin (Pierre)      | `app/(admin)`     |

Middleware reads the host header, pins the right route group, and forwards
the slug as an `x-workspace-slug` header so server components can resolve
the workspace without re-parsing the URL.

---

## 3. Who uses it

| Persona              | Plan tier | Workspace type                                                   |
|----------------------|-----------|------------------------------------------------------------------|
| Independent bartender | Creator (free) | Personal workspace, 1 seat, up to 25 cocktails                |
| DTC spirits brand, consultant | Starter ($99/mo) | 1 venue, 5 seats, up to 200 cocktails                  |
| Spirits brand, bar group | Studio ($399/mo) | Unlimited seats + cocktails, full analytics, team activity  |
| Hospitality group, global brand | Enterprise (custom) | Custom domain, SSO, SLA, dedicated success team     |

The Creator tier ships today as a fully-functional free-forever workspace
(with caps). The public "creator profile + Explore" marketplace features
are parked — see `docs/creator-profiles-proposal.md`.

ICP today: **trade marketing / brand ambassadors at US spirits brands
under $50M revenue** (tequila, mezcal, craft gin, premium rum). See
`docs/go-to-market.md` for the full GTM plan.

---

## 4. Core data model

All tables live in a single Supabase Postgres instance. Workspace isolation
is enforced by row-level security using helper functions (`is_super_admin`,
`current_workspace_role`, `can_read_workspace`, `can_write_workspace`).

**Identity & access**

- `workspaces` — one row per tenant. Columns include `slug`, `name`,
  `subscription_status`, `plan`, `owner_user_id`, `trial_ends_at`,
  `frozen_at`, `stripe_customer_id`, `stripe_subscription_id`.
- `memberships` — (`workspace_id`, `user_id`, `role`). Roles: `owner`,
  `editor`, `viewer`. Invitations use `joined_at = NULL` until accepted.
- `profiles` — one row per auth user. `full_name`, `avatar_url`,
  `job_title`, `department`.
- `super_admins` — `user_id` only. Pierre's access bypass.
- `auth.users` — Supabase's built-in auth table.

**Shared global catalog** (readable by every workspace)

- `global_products` — canonical spirit products. Brand, expression, category,
  ABV, origin, description, image, color_hex.
- `global_ingredients` — canonical ingredients. Name, category,
  default_unit, allergens.
- `catalog_suggestions` — moderation queue (currently unused; tenant UI
  to submit suggestions exists but is not wired up).

**Workspace-private content**

- `cocktails` — name, slug, status, category, spirit_base, glass_type,
  garnish, tasting_notes, flavor_profile, season, occasions, orb colors,
  images, method_steps, creator_id, base_product_id, menu/cost pricing,
  featured/pinned flags, `visibility` (private default).
- `cocktail_ingredients` — join table between cocktails and
  `global_ingredients` / `global_products` / `workspace_ingredients`.
  Position, amount, unit, amount_text, notes.
- `creators` — per-workspace creator roster. Name, role, venue, city,
  country, bio, photo, socials, specialties, awards. `profile_id` FK
  reserved for the (parked) canonical-profile feature.
- `workspace_ingredients` — tenant-private pantry items that aren't in
  the global catalog.
- `workspace_products` — tenant stock + pricing overrides on global
  products.
- `collections` — folder-style groupings. `pinned` flag surfaces them on
  the sidebar.
- `user_cocktail_favorites` — per-user bookmarks.

**Operational tables**

- `activity_events` — per-workspace user-activity log (see §7).
- `audit_events` — super-admin audit trail (service-role-only).
- `audit_logs` — workspace-visible access log (team page).
- `user_notification_prefs` — per-user, per-workspace email preferences.
- `workspace_settings` — pricing_enabled, density, typography, accent,
  reduce_motion.

---

## 5. Product surfaces (what actually works)

### 5.1 Marketing (`app/(marketing)/`)

- Landing page with hero, tour, features bento, integrations grid
  (honest — 6 items with ETAs, no vapor-ware), security section,
  pricing (4 tiers with Enterprise strip), FAQ, CTA.
- `/contact` — topic-aware contact form, server action persists, rate
  limited.
- `/signup` — plan-aware (URL `?plan=creator|starter|studio`), Stripe
  checkout for paid tiers, Creator is free-forever (`subscription_status =
  'gifted'`).
- `/login` — magic link + password. No OAuth (SSO is Enterprise-only and
  not shipped).
- `/legal/{terms,privacy,security,dpa,cookies}` — full legal set.

### 5.2 Tenant (`app/(tenant)/`)

**Dashboard** — Hero stats, pinned cocktails, top creators (5 cards on
desktop, 4 on tablet, 2 on mobile), recent activity, stock/ingredients
snapshot, quick actions.

**Cocktails** — Library list with client-side filtering (spirit, category,
season, occasion, search) + sort. Detail page with hero image, ingredients,
method steps, creator bio, venue, similar cocktails (Jaccard + spirit
weighting). Edit page with tabs. Create wizard with image upload (client-
side JPEG compression). Slug-based URLs with UUID backwards-compat
redirect.

**Creators** — Roster grid with avatars. Detail page with cocktails,
bio, venue, socials, awards, career, press.

**Ingredients** — Workspace pantry + global catalog view. Tabs for
category. "Suggest to global" action exists but is orphan code.

**Products** — Workspace stock + pricing overlay on the global catalog.
Edit page shows which cocktails reference the product.

**Collections** — User-made groupings. Pinned collections show in the
sidebar.

**Analytics** — Two tabs (visible only to workspace owner + super-admin):

- **Library** (everyone) — cocktail stats, top spirits, ingredient usage,
  margin mix.
- **Team activity** (owner + super-admin) — top cocktails by views, top
  searches (with zero-result callout), active members grid, 50-event
  timeline with "admin" impersonation badge. Toggle 7 / 30 / 90 days.

**Settings** — `/settings` (profile), `/settings/team` (roster + invites,
owner-only for mutations), `/settings/billing` (Stripe customer portal),
`/settings/notifications` (per-user prefs).

### 5.3 Admin (`app/(admin)/admin/`)

Super-admin-only (gated at layout level via `super_admins` table check).
Dark `OpShell` theme, separate from the tenant UI.

- **Overview** — MRR, signups/week, churn (placeholder), active
  workspaces, past-due flag, attention list (past-due + expiring trials),
  recent audit log.
- **Workspaces** — All tenants, filter by status, search, sort. Row →
  detail page with members, cocktails count, last active, Stripe ID,
  impersonate button, gift / ungift action.
- **Catalog** — 3-tab browser (Products / Ingredients / Suggestions):
  - Products (31) + Ingredients (664) with search, category filter, sort
    by name or usage, "unused only" and "incomplete only" chips,
    completeness dot on rows missing critical fields.
  - Product / Ingredient detail pages: full edit form, usage panel,
    merge-into (re-points every FK then deletes source, handles
    `workspace_products UNIQUE` collisions), delete (blocked if
    referenced).
  - New-entry pages for manual catalog additions.
  - Suggestions tab preserved for when tenant UI gets wired up.
- **Users** — All auth users across workspaces.
- **Catalog suggestions** — nested under Catalog, works on the one row
  that exists should users submit.
- **Billing** — past-due, trialing, failed-charge lists.
- **Audit log** — super-admin activity trail.
- **Activity** — cross-workspace user-activity view (see §7) + per-
  workspace drill-down with timeline, top cocktails, top searches,
  members.
- **Emails** — email template previews.
- **Impersonate** — `/api/impersonate/start?workspace_id=…` signs in as
  the owner with an `sb_impersonation` cookie. Banner in the tenant shell
  surfaces the active impersonation.

---

## 6. Plan tiers & caps

Live on the homepage pricing section. Enforced server-side via
`lib/workspace/plan.ts`:

| Plan | Price | Cocktails | Seats | Venues | Billing | Trial |
|------|-------|-----------|-------|--------|---------|-------|
| Creator | Free forever | 25 | 1 | 1 | `subscription_status = 'gifted'` | n/a |
| Starter | $99 / mo | 200 | 5 | 1 | Stripe | 14 days |
| Studio | $399 / mo | ∞ | ∞ | ∞ | Stripe | 14 days |
| Enterprise | Custom | ∞ | ∞ | ∞ | Custom contract | On request |

**Caps enforced today:** Creator 25-cocktail cap is hard-blocked in
`submitCocktailDraft`. Seat cap for Creator not yet enforced on the
invite flow (`joined_at IS NULL` invites don't count — conservative).
Starter caps not enforced yet.

**Stripe work still outstanding** to actually bill the new tiers:
1. Create `starter_monthly` ($99) and `studio_monthly` ($399) products
   in Stripe dashboard.
2. Update `lib/stripe/checkout.ts` to pick the price ID from
   `workspace.plan`.
3. Billing portal copy for the new tier names.

See `docs/go-to-market.md` §6.2 for the concrete punch list.

---

## 7. Activity tracking

Three-PR system shipped 2026-04-23. Full design in `docs/go-to-market.md`
and the git log (PRs 1-3: `cf57d3a`, `b4f266d`, `5092630`).

**Table:** `activity_events` with `workspace_id`, `user_id`,
`occurred_at`, `kind`, `target_type`, `target_id`, `target_label`,
`metadata jsonb`, `session_id`, `is_admin_impersonation`. Indexed on
(workspace, time), (workspace, kind, time), (workspace, user, time), and
(workspace, target).

**Events:** `cocktail.view`, `product.view`, `creator.view`, `page.view`,
`search.query`, `cocktail.favorite`, `cocktail.unfavorite`,
`cocktail.create`, `cocktail.edit`, `cocktail.delete`.

**Write path:** `lib/activity/track.ts`. Fire-and-forget server-side with
a 30s Upstash-backed dedupe window (keyed by workspace + user + kind +
target or discriminator). Skips prefetch requests via
`Next-Router-Prefetch` header. Impersonation cookie flagged in row.

**Read path:** `lib/activity/read.ts` — getTopCocktailsByViews,
getTopSearches, getActiveMembers, getRecentActivity, getActivitySummary.

**RLS:** owners + super-admin read. Any workspace member can INSERT their
own events. No UPDATE / DELETE policy (append-only; retention runs as
service role).

**Retention:** Vercel cron at `/api/cron/activity-retention` fires daily
at 03:00 UTC with CRON_SECRET bearer auth, deletes events older than 90
days.

**UI:**
- Owner view at `/analytics?tab=team`.
- Super-admin view at `/admin/activity` + drill-down
  `/admin/activity/[workspaceId]`.

**Anonymization:** when a membership is deleted, a trigger nulls
`user_id` on the member's events for that workspace and stamps
`metadata.removed_at`. Aggregates preserved, attribution scrubbed.

---

## 8. Integrations

**Live:** none. Stripe is integrated for billing but isn't surfaced as a
user-facing "integration".

**Marketing claims (honest):** 6-item integration grid with ETAs. See
`docs/integrations-roadmap.md` for the full plan.

Priority order if / when we build:
1. Webhooks out (1 week) — unlocks power users
2. Read API + API keys (2 weeks)
3. Official Zapier app (1-2 weeks + review) — unlocks ~6,000 other apps
4. Slack native (1-2 weeks) — most-requested-feeling
5. Toast POS native (4-6 weeks) — the real differentiator for Studio

Don't start any of these until a paying customer asks.

---

## 9. Marketing-page honesty

Every claim on `shakebase.co` must be defensible. Commit `231416d`
(2026-04-23) did a pass; key decisions:

- **SOC 2 Type II** — removed from every surface. We run on Vercel +
  Supabase which are SOC 2 Type II sub-processors; a ShakeBase-level
  audit is on the roadmap.
- **POS integrations** — marked Q4 2026, not "live today".
- **SSO** — moved from Studio to Enterprise-only.
- **Analytics 2.0 / 38% stat** — removed; swapped for the real changelog
  ("team activity tracking").
- **Testimonials + "trusted by" logos** — already disabled in code,
  kept disabled.
- **Casa Dragones** — off-limits for any public communication. They're
  a complimentary friends workspace, not a design partner or case study.

---

## 10. Commercial state

**Paying customers:** zero.
**Free / friends customers:** one (Casa Dragones, 260 cocktails, 108
creators). Not for external communication.

**Trial-to-paid conversion:** untested.

**Acquisition channels active:** none.

**Revenue:** zero.

See `docs/go-to-market.md` for the proposed 4-week plan to validate ICP
via outbound + onboarding polish + credibility cleanup.

---

## 11. Roadmap (parked items)

Documents in `docs/` capture work that's fully specified but intentionally
deferred:

- **`docs/creator-profiles-proposal.md`** — two-sided marketplace
  extension. Bartenders get public profiles, can publish cocktails to a
  public Explore page, brands discover creators. Pivot from B2B SaaS to
  platform. PR 1 (canonical profiles + claim flow) is cheap to do first
  even if PR 2/3 wait.
- **`docs/integrations-roadmap.md`** — full integrations plan covering
  Webhooks, API, Zapier, Slack, Toast POS.
- **`docs/go-to-market.md`** — ICP, outbound, pricing restructure,
  credibility cleanup, onboarding polish. Primary "what to do next"
  reference.

---

## 12. Project layout

```
Shakebase V3/
├── app/
│   ├── (marketing)/         Public landing + legal + signup/login
│   ├── (tenant)/            Tenant product pages
│   ├── (admin)/             Super-admin console
│   ├── api/                 Route handlers (activity, webhooks, impersonation)
│   └── layout.tsx           Root layout (GA, fonts, metadata)
├── components/
│   ├── shell/               Topbar, Sidebar, notifications bell
│   ├── admin/               OpShell + admin icon set
│   ├── cocktail/            Cards, avatars, orbs, glass icons
│   ├── auth/                AuthShell, signup/login art
│   └── tracking/            PageViewTracker (client)
├── lib/
│   ├── supabase/            server.ts, client.ts, admin.ts
│   ├── workspace/           context.ts, plan.ts
│   ├── activity/            track.ts, kinds.ts, read.ts
│   ├── stripe/              checkout.ts, client.ts, webhook handling
│   ├── email/               send.ts, templates.ts
│   ├── rate-limit.ts        Upstash ratelimit + raw Redis export
│   ├── auth/session.ts      getUser, requireUser
│   └── types/database.ts    Supabase-generated types
├── supabase/
│   ├── migrations/          All SQL migrations (YYYYMMDDHHmmss_name.sql)
│   └── seed.sql
├── styles/
│   └── globals.css          Design system + tenant styles
├── docs/                    Planning docs (this one, GTM, roadmaps)
├── _smoke/                  One-shot scripts (seed, clean, import, etc.)
├── middleware.ts            Subdomain routing
├── ARCHITECTURE.md          Technical architecture (deeper than this doc)
└── vercel.json              Cron schedules
```

---

## 13. Environment variables

Required for production:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY      (or the publishable sb_publishable_* key)
SUPABASE_SERVICE_ROLE_KEY           (service role, server-only)
NEXT_PUBLIC_ROOT_DOMAIN             (e.g. 'shakebase.co')

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PRICE_ID_STUDIO  (to be split once Starter ships)

RESEND_API_KEY

UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

CRON_SECRET                          (bearer token for /api/cron/*)

NEXT_PUBLIC_GA_ID                    (optional; defaults to G-H9NNE5P044)
```

Local dev reads `.env.local`. Preview / production env vars live on Vercel.

---

## 14. How to run locally

```bash
# 1. Install
pnpm install          # or npm install

# 2. Start Next dev server
pnpm dev

# 3. Apply any unapplied migrations to the linked Supabase project
supabase db push

# 4. Regenerate types if schema changed
supabase gen types typescript --linked --schema public \
  | awk '/^export type Json/{f=1} f' > lib/types/database.ts

# 5. Type-check
pnpm tsc --noEmit
```

Subdomains for local dev need a wildcard `.localhost` trick or `nip.io` —
see `middleware.ts` for how it resolves the slug in dev mode.

One-shot utility scripts live in `_smoke/`. Each one is a standalone
`.mjs` file that loads `.env.local` and runs against the service-role
client. Pattern: `node _smoke/<name>.mjs`.

---

## 15. Known gotchas

- **React 19 + server components** — you cannot pass a function prop
  (like `onChange`) from a server component to a DOM element. Extract
  into a `'use client'` component. (We hit this hard on
  `/settings/team` — see commit `0d78e8e`.)
- **Supabase default 1000-row limit** — many queries quietly cap at 1000.
  Explicitly `.limit(N)` when you need more.
- **`getCurrentWorkspace()` throws `notFound()`** — wrap in try/catch
  when calling from routes where the workspace may not exist (e.g. the
  admin subdomain).
- **Creator tier uses `subscription_status = 'gifted'`** — not a
  separate state. If you add logic that gates on `subscription_status`,
  remember gifted means "free, never billed, never frozen".
- **Activity tracking is async** — if a page load finishes before
  `trackEvent()` returns, the serverless function terminates and the
  insert is dropped. We await it today. Future `after()` wrapper would
  fix this.
- **Tenant search is 100% client-side** — the cocktails list fetches all
  cocktails up to 1000 and filters in `LibraryBrowser.tsx`. Fine today;
  needs SSR pagination once a workspace has 5k+ cocktails.
- **pg_trgm extension** lives in the `extensions` schema, not `public`.
- **Stripe webhooks** — tested in dev via `stripe listen` forwarding to
  `http://localhost:3000/api/stripe/webhook`. Production webhook secret
  is different.

---

## 16. Getting oriented quickly

If you've just cloned this repo:

1. Read this file (you are here)
2. Skim `ARCHITECTURE.md` for the deeper technical story
3. Check `docs/go-to-market.md` to understand the current priorities
4. Check `docs/integrations-roadmap.md` and
   `docs/creator-profiles-proposal.md` to understand what's *parked*
5. Skim the migrations in `supabase/migrations/` — the filenames are
   chronological and each one is scoped to a single decision
6. Clone the production schema with `supabase db pull` if you need a
   fresh baseline

The project is held together by clear per-feature boundaries: each tenant
section (cocktails, creators, ingredients, products, analytics, settings)
has its own folder. Each admin section too. Shared helpers live in `lib/`.
Every server action is in its own file next to the page that calls it.
