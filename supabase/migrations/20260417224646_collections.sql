-- Collections: curated bundles of cocktails for menus, events, press kits.
-- Workspace-scoped. Join table tracks membership + ordering.

CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_from text NOT NULL DEFAULT '#ffd9c2',
  cover_to text NOT NULL DEFAULT '#c5492a',
  pinned boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX collections_workspace_idx ON collections (workspace_id);
CREATE INDEX collections_pinned_idx
  ON collections (workspace_id, pinned) WHERE pinned = true;

CREATE TABLE collection_cocktails (
  collection_id uuid NOT NULL REFERENCES collections ON DELETE CASCADE,
  cocktail_id uuid NOT NULL REFERENCES cocktails ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, cocktail_id)
);
CREATE INDEX collection_cocktails_cocktail_idx
  ON collection_cocktails (cocktail_id);

-- Touch trigger
CREATE TRIGGER collections_touch BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS
ALTER TABLE collections           ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_cocktails  ENABLE ROW LEVEL SECURITY;

CREATE POLICY collections_read ON collections FOR SELECT
  USING (can_read_workspace(workspace_id));
CREATE POLICY collections_write ON collections FOR ALL
  USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));

CREATE POLICY collection_cocktails_read ON collection_cocktails FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM collections c
    WHERE c.id = collection_id AND can_read_workspace(c.workspace_id)
  ));
CREATE POLICY collection_cocktails_write ON collection_cocktails FOR ALL
  USING (EXISTS (
    SELECT 1 FROM collections c
    WHERE c.id = collection_id AND can_write_workspace(c.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM collections c
    WHERE c.id = collection_id AND can_write_workspace(c.workspace_id)
  ));
