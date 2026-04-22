-- Audit log for platform events. Super-admin & system actions write here
-- via the service-role client; end users never write directly.

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at timestamptz NOT NULL DEFAULT now(),
  actor_kind text NOT NULL CHECK (actor_kind IN ('admin','impersonation','user','system')),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  -- When actor_kind = 'impersonation', points to the real admin pulling the strings.
  impersonating_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_kind text,
  target_id text,
  target_label text,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS audit_events_at_idx ON audit_events (at DESC);
CREATE INDEX IF NOT EXISTS audit_events_workspace_idx
  ON audit_events (workspace_id, at DESC)
  WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_events_actor_idx
  ON audit_events (actor_user_id, at DESC);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Read: super admins see everything.
DROP POLICY IF EXISTS audit_events_admin_read ON audit_events;
CREATE POLICY audit_events_admin_read ON audit_events
  FOR SELECT
  USING (is_super_admin());

-- No INSERT/UPDATE/DELETE policies — writes go through the service role only.
