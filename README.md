# ShakeBase

Multi-tenant SaaS cocktail database. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full plan.

## Stack

Next.js 15 · React 19 · TypeScript · Supabase · Stripe · Tailwind v4 · Resend · Vercel

## Local dev

```bash
pnpm install
cp .env.local.example .env.local      # fill in secrets
pnpm supabase start                    # local Supabase (requires Docker + Supabase CLI)
pnpm db:push                           # apply migrations
pnpm dev                               # http://localhost:3000
```

Subdomains locally use `lvh.me` (resolves `*.lvh.me` → `127.0.0.1`):

- Marketing: <http://lvh.me:3000>
- Tenant app: <http://casa-dragones.lvh.me:3000>
- Super-admin: <http://admin.lvh.me:3000>

## Directory map

- `app/(marketing)/` — public site & signup
- `app/(tenant)/` — workspace app (per subdomain)
- `app/(admin)/` — super-admin panel
- `lib/supabase/` — DB clients
- `lib/workspace/` — tenant resolution
- `supabase/migrations/` — SQL migrations
- `components/` — UI primitives + shell
- `middleware.ts` — subdomain routing
