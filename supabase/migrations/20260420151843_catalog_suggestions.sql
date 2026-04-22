-- Catalog moderation queue. Workspaces submit products or ingredients
-- they want in the shared canonical catalog; super admins review.

CREATE TABLE IF NOT EXISTS catalog_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('product','ingredient')),

  -- Common fields
  name text NOT NULL,
  category text,
  note text,                -- submitter's free-form note/context

  -- Product-only fields (NULL for ingredient)
  brand text,
  expression text,
  abv numeric(4,2),
  origin text,
  description text,
  image_url text,

  -- Ingredient-only fields (NULL for product)
  default_unit text,
  allergens text[] DEFAULT '{}',

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','merged')),

  suggested_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  suggested_from_workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  suggested_at timestamptz NOT NULL DEFAULT now(),

  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,

  -- If approved: the canonical row we created (points at global_products.id
  -- or global_ingredients.id depending on kind). If merged: the existing
  -- canonical row we pointed the submitter at.
  canonical_id uuid
);

CREATE INDEX IF NOT EXISTS catalog_suggestions_status_idx
  ON catalog_suggestions (status, suggested_at DESC);
CREATE INDEX IF NOT EXISTS catalog_suggestions_workspace_idx
  ON catalog_suggestions (suggested_from_workspace_id);
CREATE INDEX IF NOT EXISTS catalog_suggestions_kind_idx
  ON catalog_suggestions (kind);

ALTER TABLE catalog_suggestions ENABLE ROW LEVEL SECURITY;

-- Workspace members can INSERT suggestions for their workspace.
DROP POLICY IF EXISTS catalog_suggestions_ws_insert ON catalog_suggestions;
CREATE POLICY catalog_suggestions_ws_insert ON catalog_suggestions
  FOR INSERT
  WITH CHECK (
    suggested_by_user_id = auth.uid()
    AND can_write_workspace(suggested_from_workspace_id)
  );

-- Members can read their workspace's suggestions; super admins read all.
DROP POLICY IF EXISTS catalog_suggestions_read ON catalog_suggestions;
CREATE POLICY catalog_suggestions_read ON catalog_suggestions
  FOR SELECT
  USING (
    is_super_admin()
    OR (
      suggested_from_workspace_id IS NOT NULL
      AND can_read_workspace(suggested_from_workspace_id)
    )
  );

-- Only super admins can update (review workflow); service role bypasses RLS.
DROP POLICY IF EXISTS catalog_suggestions_admin_update ON catalog_suggestions;
CREATE POLICY catalog_suggestions_admin_update ON catalog_suggestions
  FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());
