-- Per-workspace toggle: show pricing / margin / cost UI.
-- Default ON so existing tenants aren't surprised. Brand workspaces that
-- only use ShakeBase as a library (e.g. Casa Dragones) can turn it off.

ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS pricing_enabled boolean NOT NULL DEFAULT true;
