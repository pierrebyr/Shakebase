# Integrations Roadmap

**Status:** Plan captured · no code yet
**Drafted:** 2026-04-23

The old homepage grid advertised 12 logos (Toast, Slack, Figma, GDrive, Dropbox,
Webhooks, Lightspeed, Teams, Notion, Linear, Airtable, API). **None of them
were real.** Keeping that grid was a credibility risk — a prospect clicking
"Figma integration" and finding nothing makes every other claim look thin.

This file captures the strategy to actually build integrations, cheapest-first.

---

## 1. Honest per-integration cost

Every native integration shares a core tax:

- OAuth flow + consent scopes
- Token storage + refresh logic
- Field mapping (their model ↔ ours)
- `/settings/integrations` UI (connect, status, disconnect)
- Webhooks inbound or polling
- Error handling + retry + alerting
- **Ongoing maintenance** when the API changes (~1–2× / year / integration)

Rough effort by category:

| Integration        | Build  | Reason                                    |
|--------------------|--------|-------------------------------------------|
| Slack              | 1-2 w  | Clean API, OAuth standard, simple webhooks|
| Google Drive       | 1-2 w  | Standard OAuth, file push is simple       |
| Dropbox            | 1-2 w  | Same as GDrive                            |
| Notion             | 1-2 w  | Decent API, database sync is the hard bit |
| Webhooks out       | 1 w    | HMAC-signed POST, retry queue             |
| Read API           | 2 w    | REST + bearer + rate limit (already have Upstash) |
| Zapier app         | 1-2 w  | Plus ~1 week app review by Zapier team    |
| Toast POS          | 4-6 w  | Complex data model, reconciliation, heavy polling |
| Lightspeed         | 3-5 w  | Similar to Toast, slightly cleaner API    |
| Airtable           | 2-3 w  | Two-way sync is painful                   |
| Figma / Teams / Linear | —  | **Skip.** Off-topic for a bar/brand product |

Natively building all twelve: ~4–6 months solo. Not realistic, not
differentiating — most of them are commodity plumbing a competitor also claims.

## 2. The 80/20 strategy — build the socle, not every native client

Instead of 12 native integrations, build the **three things that unlock
virtually all of them**:

### Phase 1 — Webhooks out (1 week)

Events:
- `cocktail.published`
- `cocktail.edit`
- `stock.low`
- `favorite.added`
- `creator.joined`

Per-workspace endpoint URL + HMAC signing + exponential backoff retry. This
alone lets power users wire up Slack, Discord, Airtable, or a custom backend
without us writing a line of integration-specific code.

### Phase 2 — Read API + API keys (1-2 weeks)

`GET /api/v1/cocktails`, `/ingredients`, `/creators`, `/products`, each
scoped by the API key's workspace. Bearer auth tokens generated in
`/settings/integrations`. Rate-limit via existing Upstash. OpenAPI schema
auto-generated from zod validators so a docs site (`docs.shakebase.co`) can
render cleanly.

### Phase 3 — Official Zapier app (1-2 weeks + 1 week app review)

Triggers: the webhooks from Phase 1. Actions: API calls from Phase 2. Once
reviewed and listed by Zapier, we get badge rights + a marketing surface on
their store + access to ~6,000 apps including Slack, Teams, Notion,
Airtable, Sheets, Gmail, Discord, and everything else on the old homepage
grid.

**Net effect:** five weeks of work replaces ten native integrations. The
homepage claim becomes defensible ("connects to 6,000 apps via Zapier") and
the maintenance load stays at "one Zapier app".

## 3. The native integrations that actually warrant the native build

Only two in v1:

### Slack (1-2 weeks, after Phase 1-3)

- Channel-level OAuth, pick the channel once.
- Notifications: new cocktail published, stock-low alert, new team member
  joined workspace.
- Native feels better than Zapier-routed Slack — richer Block Kit formatting,
  avatars, action buttons. Valuable and visible.

### Toast POS *or* Lightspeed (4-6 weeks, pick one)

**This is the one that matters.** The existing marketing copy and the
`/analytics` page both imply "POS data when you link a till". Today that
promise has no implementation. Shipping it is:

- A real differentiator (nobody else in cocktail library land has deep POS)
- The justification for the €480/venue/month price
- A reason the Studio tier exists at all

Pick Toast if targeting the US mid-market, Lightspeed if EU. Do one well
before touching the other — reconciliation edge cases are where the weeks go.

## 4. What to skip entirely

- **Figma** — cocktail library has no Figma surface
- **Teams / Linear** — off-topic
- **Airtable native** — covered by Zapier 90%, not worth 3 weeks
- **Notion native** — same; if a brand lives in Notion they'll use Zapier

## 5. Homepage is now aligned (commit [2026-04-23])

- 6-cell grid with ETAs (Q2 / Q3 / Q4 2026, "On request")
- Explicit "coming soon" framing
- Follow-up copy: "Once Zapier ships you get one-click connections to
  6,000+ other apps. Need something sooner? Tell us."
- FAQ on POS rewritten to reflect Q4 2026 ETA instead of claiming native
  integrations exist today

## 6. Order of execution (if/when we start)

1. **Webhooks out** (1 w) — unlocks power users
2. **Read API + docs** (2 w) — unlocks custom integrations
3. **Zapier app** (1-2 w + 1 w review) — unlocks 6k apps
4. **Slack native** (1-2 w) — unlocks the most-asked integration with a
   native feel
5. **Toast POS native** (4-6 w) — ships the real differentiator

Total: ~12–14 weeks elapsed. Every stage is independently shippable.

## 7. Decision checkpoints

- Before Phase 1: confirm a paying customer (or 3) has actually asked for
  webhooks. If not, the homepage rewrite alone is enough for now.
- Before Toast POS: confirm at least 2 Studio-tier prospects have named Toast
  as the POS they use. Don't commit 6 weeks to an integration zero of your
  next three customers need.
- Before adding a second POS: wait until the first one is used by ≥3
  workspaces in production.
