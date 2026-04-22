# ShakeBase — Architecture Plan

**Version 1 · 2026-04-17**

This is the single source of truth for how ShakeBase is built. Update it when decisions change. The existing HTML prototype in `Settings.html` + `src/` is the visual reference — this doc explains the production implementation.

---

## 1. Product scope (MVP)

**What ShakeBase is:** a multi-tenant SaaS cocktail database. Each customer (spirits brand or bar group) gets a workspace on its own subdomain — e.g. `casa-dragones.shakebase.co`. Used by marketing, R&D, and bartender teams to catalog cocktails, ingredients, products, creators, and pour analytics.

**In scope for MVP:**
- Multi-tenant SaaS with fixed subdomain per workspace
- 4 roles: `super_admin` (global) · `owner` (payer) · `editor` · `viewer`
- Self-serve signup with 14-day Stripe trial, CB mandatory at signup
- Single "Studio" pricing plan
- Shared global catalog (ingredients, products/brands) readable by all tenants
- Workspace-private data: cocktails, creators, settings, stock/cost overrides
- 9 core screens ported from prototype: Login, Dashboard, Cocktails (grid+list), Cocktail Detail, Creators, Ingredients, Products, Analytics, Settings, New Cocktail submission
- Super-admin panel on `admin.shakebase.co` to manage tenants + seed the global catalog

**Out of MVP (Phase 6+):**
- POS (Toast), Slack, Google Drive, Figma, Webhooks integrations
- Subdomain rename
- Multi-plan tiers (Solo/Studio/Enterprise)
- Custom domains (e.g. `bar.casadragones.com`)
- Native mobile app
- Full internationalization (i18n scaffolding present, only English at launch)

---

## 2. Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript strict | Matches prototype's React model, Server Components for fast pages, first-class Vercel |
| DB + Auth + Storage | Supabase (Postgres 15, EU region) | RLS for multi-tenant isolation, built-in auth, storage for images, realtime for comments later |
| Styling | Tailwind v4 + CSS variables from prototype `src/styles.css` | Keeps design-system tokens identical; Tailwind for layout productivity |
| UI primitives | shadcn/ui | Unstyled, accessible, easy to theme with our tokens |
| Billing | Stripe Billing + Customer Portal | Industry standard, webhooks handle lifecycle |
| Email | Resend | Clean DX, good deliverability, cheap at our scale |
| Hosting | Vercel | Native Next.js, wildcard subdomains, preview deploys |
| Monitoring | Vercel Analytics + Sentry (Phase 4+) | Minimal now, add when there's real traffic |
| Testing | Vitest + Playwright (smoke tests only) | Pragmatic for a solo dev |

---

## 3. Three surfaces, one Next.js codebase

A single Next.js app serves three different audiences, routed by subdomain:

| Subdomain | Audience | Routes |
|---|---|---|
| `shakebase.co` (apex + `www`) | Prospects | Marketing, pricing, signup, login |
| `<slug>.shakebase.co` | Tenant members | The product itself (dashboard, cocktails, settings…) |
| `admin.shakebase.co` | Pierre (super-admin) | Manage tenants, global catalog, impersonate, suspend |

Middleware rewrites the URL based on the subdomain to the right route group. One deploy, one DB, clean separation.

---

## 4. Project structure

```
shakebase/
├── ARCHITECTURE.md                ← this doc
├── app/
│   ├── (marketing)/               ← shakebase.co
│   │   ├── page.tsx               landing
│   │   ├── pricing/
│   │   ├── signup/
│   │   └── login/
│   ├── (tenant)/                  ← <slug>.shakebase.co
│   │   ├── layout.tsx             sidebar + topbar shell
│   │   ├── dashboard/
│   │   ├── cocktails/
│   │   │   └── [id]/
│   │   ├── cocktails/new/         multi-step submission
│   │   ├── creators/
│   │   │   └── [id]/
│   │   ├── ingredients/
│   │   ├── products/
│   │   ├── analytics/
│   │   ├── settings/
│   │   │   ├── profile/
│   │   │   ├── security/
│   │   │   ├── sessions/
│   │   │   ├── general/
│   │   │   ├── appearance/
│   │   │   ├── notifications/
│   │   │   ├── team/
│   │   │   ├── integrations/
│   │   │   ├── billing/
│   │   │   └── export/
│   │   ├── onboarding/            post-signup welcome flow
│   │   └── accept-invite/
│   ├── (admin)/                   ← admin.shakebase.co
│   │   ├── layout.tsx
│   │   ├── workspaces/
│   │   ├── catalog/
│   │   │   ├── ingredients/
│   │   │   └── products/
│   │   └── audit/
│   └── api/
│       ├── auth/callback/         Supabase SSR session exchange
│       ├── stripe/
│       │   ├── checkout/          create Checkout session
│       │   ├── portal/            create Customer Portal session
│       │   └── webhook/           Stripe event handler
│       ├── workspaces/slug-check/ live slug availability
│       └── invites/accept/
├── components/
│   ├── ui/                        shadcn primitives
│   ├── shell/                     Sidebar, Topbar (ported from shell.jsx)
│   ├── cocktail/                  DrinkOrb, PhotoPlaceholder, GlassIcon
│   ├── settings/                  shared Row, Toggle, Seg, SaveBar
│   └── icons.tsx                  Icon set (ported from icons.jsx)
├── lib/
│   ├── supabase/
│   │   ├── server.ts              createServerClient (cookies-aware)
│   │   ├── client.ts              browser client
│   │   └── admin.ts               service_role client (server-only, never exposed)
│   ├── stripe/
│   │   ├── client.ts
│   │   └── events.ts              webhook handler per event type
│   ├── auth/
│   │   ├── session.ts             getUser(), requireUser()
│   │   └── rbac.ts                requireRole('editor'), assertSuperAdmin()
│   ├── workspace/
│   │   ├── context.ts             getCurrentWorkspace() from headers
│   │   └── freeze.ts              isWorkspaceFrozen() check
│   ├── types/
│   │   └── database.ts            generated from Supabase schema
│   └── constants.ts               ROOT_DOMAIN, ROLES, etc.
├── middleware.ts                  subdomain routing
├── supabase/
│   ├── migrations/                SQL migrations (numbered)
│   ├── seed.sql                   global catalog seed
│   └── config.toml                local dev
├── styles/
│   └── globals.css                Tailwind + CSS variables (ported)
├── public/
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── .env.local.example
```

---

## 5. Database schema

All tables live in the `public` schema. All timestamps `timestamptz`. UUIDs as PKs.

### 5.1 Tenant core

```sql
CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,              -- "casa-dragones"
  name text NOT NULL,                     -- "Casa Dragones"
  owner_user_id uuid NOT NULL REFERENCES auth.users,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  subscription_status text NOT NULL DEFAULT 'pending_payment',
    -- pending_payment | trialing | active | past_due | canceled | frozen
  trial_ends_at timestamptz,
  frozen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON workspaces (slug);
CREATE INDEX ON workspaces (owner_user_id);
CREATE INDEX ON workspaces (subscription_status);

-- Slug format enforced at app layer (lowercase, alphanum + dashes, 3-40 chars).

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','editor','viewer')),
  invited_by uuid REFERENCES auth.users,
  invitation_email text,
  invitation_token text UNIQUE,
  invitation_expires_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON memberships (workspace_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  language text DEFAULT 'en',
  time_zone text DEFAULT 'Europe/Paris',
  job_title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 5.2 Global shared catalog

```sql
CREATE TABLE global_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text,                          -- citrus, syrup, bitter, garnish…
  allergens text[] DEFAULT '{}',
  default_unit text DEFAULT 'ml',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE global_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,                    -- "Casa Dragones"
  expression text NOT NULL,               -- "Blanco"
  category text NOT NULL,                 -- tequila | mezcal | gin | rum | whiskey | vermouth | liqueur
  abv numeric(4,2),
  origin text,                            -- "Jalisco, MX"
  description text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (brand, expression)
);
CREATE INDEX ON global_products (category);
```

### 5.3 Workspace-private data

```sql
CREATE TABLE creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  name text NOT NULL,
  bio text,
  venue text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON creators (workspace_id);

CREATE TABLE cocktails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','published','archived')),
  category text,
  spirit_base text,                       -- tequila, gin, whiskey…
  season text[] DEFAULT '{}',
  occasions text[] DEFAULT '{}',
  glass_type text,                        -- Coupe, Rocks, Highball…
  method_steps jsonb,                     -- [{step: 1, text: '…'}]
  tasting_notes text,
  flavor_profile text[] DEFAULT '{}',
  garnish text,
  venue text,
  event_origin text,
  cost_cents integer,
  menu_price_cents integer,
  currency text DEFAULT 'EUR',
  image_url text,
  orb_from text,                          -- gradient
  orb_to text,
  creator_id uuid REFERENCES creators ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (workspace_id, slug)
);
CREATE INDEX ON cocktails (workspace_id);
CREATE INDEX ON cocktails (workspace_id, status);

CREATE TABLE cocktail_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cocktail_id uuid NOT NULL REFERENCES cocktails ON DELETE CASCADE,
  position integer NOT NULL,
  global_ingredient_id uuid REFERENCES global_ingredients,
  global_product_id uuid REFERENCES global_products,
  workspace_ingredient_id uuid,           -- FK added below after workspace_ingredients
  custom_name text,                       -- if truly ad-hoc
  amount numeric(6,2),
  unit text,
  notes text,
  CHECK (num_nonnulls(global_ingredient_id, global_product_id, workspace_ingredient_id, custom_name) >= 1)
);
CREATE INDEX ON cocktail_ingredients (cocktail_id);

CREATE TABLE workspace_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  default_unit text DEFAULT 'ml',
  UNIQUE (workspace_id, name)
);

ALTER TABLE cocktail_ingredients
  ADD CONSTRAINT ci_ws_ing_fk
  FOREIGN KEY (workspace_ingredient_id)
  REFERENCES workspace_ingredients ON DELETE SET NULL;

CREATE TABLE workspace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  global_product_id uuid NOT NULL REFERENCES global_products,
  stock integer,
  par integer,
  cost_cents integer,
  notes text,
  UNIQUE (workspace_id, global_product_id)
);
CREATE INDEX ON workspace_products (workspace_id);
```

### 5.4 Settings & audit

```sql
CREATE TABLE workspace_settings (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces ON DELETE CASCADE,
  default_units text DEFAULT 'metric'
    CHECK (default_units IN ('metric','imperial','both')),
  default_view text DEFAULT 'grid' CHECK (default_view IN ('grid','list')),
  autosave boolean DEFAULT true,
  show_costs boolean DEFAULT true,
  theme text DEFAULT 'light' CHECK (theme IN ('light','dark','system')),
  accent text DEFAULT '#c49155',
  density text DEFAULT 'comfortable' CHECK (density IN ('comfortable','compact')),
  typography text DEFAULT 'technical'
    CHECK (typography IN ('default','editorial','technical')),
  reduce_motion boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE user_notification_prefs (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE,
  submissions boolean DEFAULT true,
  mentions boolean DEFAULT true,
  digest boolean DEFAULT true,
  stock_alerts boolean DEFAULT true,
  channel text DEFAULT 'in-app' CHECK (channel IN ('email','in-app','both')),
  PRIMARY KEY (user_id, workspace_id)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users,
  action text NOT NULL,                   -- "cocktail.create", "member.invite"…
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON audit_logs (workspace_id, created_at DESC);
```

### 5.5 Storage buckets (Supabase Storage)

- `cocktail-images` — private, signed URLs, RLS by workspace_id via path prefix `workspaceId/...`
- `avatars` — public read, RLS write by owner
- `product-images` — public read, super_admin write only

---

## 6. Row-level security

Helpers first (used by every policy):

```sql
CREATE OR REPLACE FUNCTION current_workspace_role(ws uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM memberships
  WHERE workspace_id = ws
    AND user_id = auth.uid()
    AND joined_at IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS(SELECT 1 FROM super_admins WHERE user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION can_write(ws uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT current_workspace_role(ws) IN ('owner','editor') OR is_super_admin()
$$;
```

Policy pattern per table — three buckets:

**Workspace-private tables** (cocktails, creators, workspace_products, etc.):
- SELECT: `current_workspace_role(workspace_id) IS NOT NULL OR is_super_admin()`
- INSERT/UPDATE/DELETE: `can_write(workspace_id)` + freeze check in app layer

**Global catalog tables** (global_ingredients, global_products):
- SELECT: `auth.role() = 'authenticated'`
- INSERT/UPDATE/DELETE: `is_super_admin()`

**workspaces & memberships**:
- workspaces SELECT: `current_workspace_role(id) IS NOT NULL OR is_super_admin()`
- workspaces UPDATE: only columns changeable by owner; billing columns only via service_role
- memberships SELECT: same workspace members + super_admin
- memberships INSERT/UPDATE/DELETE: owner of that workspace + super_admin

All server mutations go through `lib/supabase/server.ts` (cookie-based user session). Billing writes + webhook handlers use `lib/supabase/admin.ts` (service_role) — never exposed to the browser.

---

## 7. Subdomain routing (middleware)

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!  // "shakebase.co"

export const config = {
  matcher: ['/((?!api|_next|_vercel|favicon.ico|robots.txt).*)']
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host')!.split(':')[0]
  const isLocal = host.endsWith('localhost')
  const rootHost = isLocal ? 'localhost' : ROOT_DOMAIN

  let sub: string | null = null
  if (host !== rootHost && host !== `www.${rootHost}`) {
    sub = host.replace(`.${rootHost}`, '')
  }

  const url = req.nextUrl.clone()
  const reqHeaders = new Headers(req.headers)

  if (sub === 'admin') {
    url.pathname = `/(admin)${url.pathname}`
    reqHeaders.set('x-app-layer', 'admin')
  } else if (sub) {
    url.pathname = `/(tenant)${url.pathname}`
    reqHeaders.set('x-app-layer', 'tenant')
    reqHeaders.set('x-workspace-slug', sub)
  } else {
    url.pathname = `/(marketing)${url.pathname}`
    reqHeaders.set('x-app-layer', 'marketing')
  }

  return NextResponse.rewrite(url, { request: { headers: reqHeaders } })
}
```

In a tenant server component:

```ts
// lib/workspace/context.ts
export async function getCurrentWorkspace() {
  const slug = (await headers()).get('x-workspace-slug')
  if (!slug) notFound()
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('workspaces').select('*').eq('slug', slug).single()
  if (!data) notFound()
  return data
}
```

Local dev: use `lvh.me` (resolves `*.lvh.me → 127.0.0.1`) so `casa-dragones.lvh.me:3000` works without touching hosts file.

---

## 8. Auth & signup flow

### Signup (self-serve with trial)

1. Prospect on `shakebase.co/signup` fills: email, password, full name, workspace name, desired slug.
2. Live slug check via `/api/workspaces/slug-check?slug=casa-dragones` (debounced 400 ms).
3. Submit → `/api/auth/signup` server action:
   a. Create `auth.users` (email+password, email_confirm enforced).
   b. Insert `profiles` row.
   c. Insert `workspaces` row with `subscription_status = 'pending_payment'`.
   d. Insert `memberships` row, role `owner`, `joined_at = now()`.
   e. Insert default `workspace_settings` + `user_notification_prefs` rows.
   f. Create Stripe Checkout Session: `mode=subscription`, `price=STRIPE_STUDIO_PRICE_ID`, `subscription_data.trial_period_days=14`, `payment_method_collection=always`, `metadata.workspace_id=<id>`.
   g. Return `{ checkout_url }` → client redirects.
4. User enters CB on Stripe Checkout → Stripe redirects to `shakebase.co/signup/success?session_id=...`.
5. `/signup/success`:
   a. Retrieve session server-side, verify `payment_status = 'paid'` or trial.
   b. Update workspace: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status='trialing'`, `trial_ends_at`.
   c. Redirect to `<slug>.shakebase.co/onboarding`.
6. Webhook `checkout.session.completed` runs the same update idempotently as a safety net.

### Login

- `shakebase.co/login` — email+password via Supabase Auth
- After auth, cookies set via `@supabase/ssr`
- Redirect rules:
  - If user has 0 workspaces → `/signup` (shouldn't happen normally, edge case)
  - If user has 1 workspace → `https://<slug>.shakebase.co/dashboard`
  - If user has 2+ → `shakebase.co/workspaces` picker
- Google/Apple SSO wired **after** MVP launch

### Invitation flow

1. Owner on `settings/team` → "Invite teammate" → email + role.
2. `/api/invites/create` inserts `memberships` row with `invitation_token`, `invitation_expires_at = now() + 7d`, `user_id = NULL`.
3. Resend email with link: `https://<slug>.shakebase.co/accept-invite?token=<token>`.
4. Clicking link:
   - If logged in & email matches → accept (`user_id=auth.uid()`, `joined_at=now()`), redirect to dashboard.
   - If logged out → `/login?redirect=...` or `/signup?invite=...` (invite signup skips workspace creation and Stripe).

### Session & logout

- `@supabase/ssr` package handles cookie session reads in server components and server actions.
- Logout hits `/api/auth/logout` → `supabase.auth.signOut()` → redirect to `shakebase.co`.

---

## 9. Stripe integration

### Products

- One Product: "Studio Plan"
- One recurring Price (monthly), amount **TBD — confirm before going live** (design mentions €480/mo, but that's prototype text; set real value in Stripe dashboard and paste the `price_xxx` id into env).

### Checkout session (at signup)

- `mode: 'subscription'`
- `subscription_data.trial_period_days: 14`
- `payment_method_collection: 'always'` (enforce CB capture)
- `metadata: { workspace_id }`
- `success_url: https://shakebase.co/signup/success?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url: https://shakebase.co/signup?cancelled=1`

### Customer Portal

- Linked from Settings → Billing
- Server action creates a portal session with `return_url: https://<slug>.shakebase.co/settings/billing`

### Webhook events to handle (`/api/stripe/webhook`)

| Event | Action |
|---|---|
| `checkout.session.completed` | Persist IDs, set `subscription_status='trialing'`, set `trial_ends_at` |
| `customer.subscription.updated` | Sync status + trial_ends_at |
| `customer.subscription.trial_will_end` | Schedule Resend email to owner (J-3 reminder) |
| `invoice.payment_succeeded` | Set `subscription_status='active'` |
| `invoice.payment_failed` | Set `subscription_status='past_due'` |
| `customer.subscription.deleted` | Set `subscription_status='canceled'`, set `frozen_at=now()+3d` |

Idempotency: every webhook handler is keyed on `(workspace_id, event.id)` in a `stripe_webhook_events` log table to ignore duplicates.

### Freeze logic

In a server-side helper `isWorkspaceFrozen(workspace)`:
- `subscription_status in ('past_due','canceled')` AND `frozen_at < now()` → true.
- If frozen: all mutations return 403 with `{ code: 'workspace_frozen' }`. Read still works. App shows a banner linking to billing.

---

## 10. Environment variables

`.env.local.example`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STUDIO_PRICE_ID=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@shakebase.co

# App
NEXT_PUBLIC_ROOT_DOMAIN=shakebase.co
NEXT_PUBLIC_APP_URL=https://shakebase.co

# Dev-only
NEXT_PUBLIC_DEV_ROOT_DOMAIN=lvh.me
```

Secrets loaded into Vercel as encrypted env vars (dev, preview, production separately).

---

## 11. Deployment

1. **Supabase** — create project in EU (Paris or Frankfurt). Enable extensions: `pg_cron` (scheduled jobs later), `pg_trgm` (search). Run migrations via Supabase CLI. Seed global catalog. Set up storage buckets with RLS.
2. **Vercel** — import GitHub repo. Add domains: apex `shakebase.co`, `www.shakebase.co`, `admin.shakebase.co`, and **wildcard `*.shakebase.co`**. Paste env vars.
3. **DNS** — point `shakebase.co` to Vercel (either nameservers or A/AAAA + wildcard CNAME per Vercel's instructions).
4. **Stripe** — create Product + Price in dashboard. Create webhook endpoint `https://shakebase.co/api/stripe/webhook` with the 6 events. Copy signing secret to env.
5. **Resend** — verify `shakebase.co` domain (DKIM, SPF). Add API key to env.
6. **Super-admin seed** — manually insert Pierre's user_id into `super_admins` via Supabase SQL editor after first signup.

Dev environment: Supabase CLI local dev (`supabase start`), Stripe CLI for webhook forwarding, `lvh.me` for subdomains.

---

## 12. Seed data

`supabase/seed.sql` bootstraps the global catalog. Keep it modest; super-admin panel will expand it.

- **~40 global_ingredients** across: citrus (lime, lemon, grapefruit juice), sugars/syrups (simple, agave, demerara, grenadine), bitters (Angostura, orange, Peychaud's), herbs (mint, basil, thyme), fruit (strawberry, pineapple, apple), dairy (egg white, cream), garnishes (salt, sugar rim, orange zest…).
- **~30 global_products** across: tequila (Casa Dragones × 5, Patrón × 3, Don Julio × 2), mezcal (Del Maguey × 3, Montelobos), gin (Hendrick's, Tanqueray, Monkey 47), whiskey (Buffalo Trace, Laphroaig, Nikka), rum (Diplomatico, Plantation), vermouth (Dolin, Carpano), liqueurs (Cointreau, Chartreuse, Campari, Aperol).

---

## 13. Build order

### Phase 1 — Foundations (week 1)

- `pnpm create next-app`, Tailwind v4, TypeScript strict
- Port `src/styles.css` tokens → `styles/globals.css`
- Port `icons.jsx`, `components.jsx`, `shell.jsx` → TSX components
- Supabase project + migrations (all tables + RLS)
- Subdomain middleware
- Supabase Auth wiring with `@supabase/ssr`
- shadcn init + install primitives we need
- Local dev works with `lvh.me`

### Phase 2 — Signup & billing (week 2)

- Marketing landing + pricing page
- Signup form + slug-check API
- Stripe Checkout integration
- Webhook handler + state machine
- Trial banner component + freeze guard middleware for mutations

### Phase 3 — Core tenant app (weeks 3–5)

- Tenant layout (sidebar + topbar shell)
- Dashboard (stat cards, recent cocktails, quick charts)
- Cocktails library (grid + list + filters + sort)
- Cocktail detail page (hero, recipe, method, provenance, performance)
- New Cocktail submission (multi-step form with live preview)
- Creators list + profile
- Ingredients page (workspace custom + global picker)
- Products page (Casa Dragones-style catalog tied to global_products)
- Settings (all 10 sub-pages from prototype)

### Phase 4 — Super-admin + launch prep (week 6)

- `admin.shakebase.co` panel: workspaces table, global catalog editor, audit log, impersonation via service_role
- Resend transactional emails (invite, trial ending, password reset)
- Analytics page (pour counts placeholder; real data wait for integrations)
- Playwright smoke tests (signup → create cocktail)
- Deploy to Vercel production, DNS cutover

### Phase 5 — Post-launch polish

- Google / Apple SSO
- Image uploads (cocktail photos via Supabase Storage)
- Real analytics data model
- Email digests via pg_cron

### Phase 6+ — Deferred features

- Toast POS / Slack / Drive / Figma / Webhooks integrations
- Custom domains
- Multi-plan tiers
- i18n (FR + ES + JA)
- Subdomain rename with 301 redirect

---

## 14. Open items to confirm before we scaffold

1. **Pricing for Studio** — what's the real monthly price? (prototype says €480/mo — is that the target?)
2. **Apex domain registered?** `shakebase.co` — do you already own it, or need to buy?
3. **Supabase region** — EU (Paris) is my default, confirm.
4. **Package manager** — `pnpm` (fast, solid) vs `npm`. Default to pnpm.
5. **Git hosting** — GitHub repo under your account, public or private? (private default for a SaaS).
6. **First super-admin email** — which email is yours (the one we seed into `super_admins`)?

---

*End of plan. Next step: scaffold Phase 1 once items in §14 are confirmed.*
