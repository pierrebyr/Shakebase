# `_smoke/` — dev scripts

Ad-hoc Node scripts (`.mjs`) used for one-shot data operations: seeding,
cleanups, backfills, and image uploads. Each script is invoked directly
with the Supabase service-role key from `.env.local`:

```bash
node --env-file=.env.local _smoke/<script>.mjs [--dry]
```

Many scripts accept `--dry` to preview changes without writing. All scripts
are designed to be **idempotent** — safe to re-run.

## What lives here

| Category              | Purpose                                                         |
| --------------------- | --------------------------------------------------------------- |
| `seed-*.mjs`          | Populate a workspace with cocktails / creators / products.      |
| `upload-*.mjs`        | Push hero/bottle images to Supabase Storage and link rows.      |
| `clean-*.mjs`         | Normalize ingredient names, fix parsing errors, canonicalize.   |
| `enrich-*.mjs`        | Add tasting notes, flavor profiles, categories in batches.      |
| `fix-*.mjs`           | Targeted one-shot fixes for specific data anomalies.            |
| `apply-*.mjs`         | Apply recipes from imported DOCX / XLSX / PDF sources.          |
| `scan-*.mjs`          | Read-only — surface data anomalies to stdout.                   |
| `audit-*.mjs`         | Read-only — comprehensive checks on data quality.               |
| `redistribute-*.mjs`  | Backfill/reshape timestamps to make demo data look alive.       |
| `migrate-*.mjs`       | Table-to-table migrations (e.g. custom_name → global_ingredients). |
| `normalize-*.mjs`     | Case / punctuation / encoding fixes.                            |
| `finalize-stubs.mjs`  | Convert stub records to final form after edit pass.             |

## Guidelines

- **Never run destructive ops without `--dry` first.** All write scripts
  print a summary before applying.
- **Idempotency is a contract.** If a script drifts, fix it — don't make it
  stateful.
- **Scripts are NOT migrations.** Schema changes live in
  `supabase/migrations/` and are applied via `supabase db push`.
- **Secrets** come from `.env.local` — never hardcoded. Use
  `SUPABASE_SERVICE_ROLE_KEY` for admin writes.
- **Rollback = run again with corrected data.** These scripts are
  disposable once the workspace is in shape.
