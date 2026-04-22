-- Per-user cocktail favorites. Workspace-scoped so the same user in two
-- workspaces can favorite independently.

CREATE TABLE user_cocktail_favorites (
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  cocktail_id uuid NOT NULL REFERENCES cocktails ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cocktail_id)
);

CREATE INDEX user_cocktail_favorites_user_ws_idx
  ON user_cocktail_favorites (user_id, workspace_id);
CREATE INDEX user_cocktail_favorites_cocktail_idx
  ON user_cocktail_favorites (cocktail_id);

ALTER TABLE user_cocktail_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_cocktail_favorites_select ON user_cocktail_favorites
  FOR SELECT
  USING (user_id = auth.uid() AND can_read_workspace(workspace_id));

CREATE POLICY user_cocktail_favorites_write ON user_cocktail_favorites
  FOR ALL
  USING (user_id = auth.uid() AND can_read_workspace(workspace_id))
  WITH CHECK (user_id = auth.uid() AND can_read_workspace(workspace_id));
