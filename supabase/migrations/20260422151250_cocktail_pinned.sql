-- Allow pinning a cocktail so it appears in the sidebar quick-access list.
ALTER TABLE cocktails ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS cocktails_pinned_idx
  ON cocktails (workspace_id, pinned)
  WHERE pinned = true;
