-- Flag a cocktail as "featured" so it surfaces on the dashboard hero row.
ALTER TABLE cocktails ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS cocktails_featured_idx
  ON cocktails (workspace_id, featured)
  WHERE featured = true;
