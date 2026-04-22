-- =======================================================================
-- Hardening pass: seal RLS hole, add indexes for filtering at scale,
-- introduce soft-delete columns on user-facing entities.
-- =======================================================================

-- 1. Seal stripe_webhook_events — super-admin read only, inserts via
--    service role (webhook handler) which bypasses RLS anyway.
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stripe_webhook_events_admin_read ON stripe_webhook_events;
CREATE POLICY stripe_webhook_events_admin_read ON stripe_webhook_events
  FOR SELECT
  USING (is_super_admin());

-- 2. Indexes on cocktail filter columns. The dashboard/library UI filters
--    by spirit_base / category / glass_type / featured constantly.
CREATE INDEX IF NOT EXISTS cocktails_workspace_spirit_idx
  ON cocktails (workspace_id, spirit_base)
  WHERE spirit_base IS NOT NULL;

CREATE INDEX IF NOT EXISTS cocktails_workspace_category_idx
  ON cocktails (workspace_id, category)
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS cocktails_workspace_glass_idx
  ON cocktails (workspace_id, glass_type)
  WHERE glass_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS cocktails_workspace_updated_idx
  ON cocktails (workspace_id, updated_at DESC);

-- Creator filter columns
CREATE INDEX IF NOT EXISTS creators_workspace_city_idx
  ON creators (workspace_id, city)
  WHERE city IS NOT NULL;

CREATE INDEX IF NOT EXISTS creators_workspace_role_idx
  ON creators (workspace_id, role)
  WHERE role IS NOT NULL;

-- 3. Soft-delete columns. We keep rows for 30 days for recovery + audit
--    trail. Application code filters WHERE deleted_at IS NULL.
ALTER TABLE creators ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS creators_workspace_live_idx
  ON creators (workspace_id)
  WHERE deleted_at IS NULL;

ALTER TABLE collections ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS collections_workspace_live_idx
  ON collections (workspace_id)
  WHERE deleted_at IS NULL;

ALTER TABLE workspace_products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS workspace_products_workspace_live_idx
  ON workspace_products (workspace_id)
  WHERE deleted_at IS NULL;

ALTER TABLE workspace_ingredients ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS workspace_ingredients_workspace_live_idx
  ON workspace_ingredients (workspace_id)
  WHERE deleted_at IS NULL;
