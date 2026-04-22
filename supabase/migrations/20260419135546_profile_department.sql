-- Department label on profiles for richer team directory rendering.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department text;

-- Workspace-level location label (optional). Used on the Team page header.
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS location text;
