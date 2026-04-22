-- Enforce minimum 3-character slugs.
ALTER TABLE workspaces DROP CONSTRAINT workspaces_slug_check;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_slug_check
  CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$');
