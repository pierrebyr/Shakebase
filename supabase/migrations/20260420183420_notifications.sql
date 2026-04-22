-- In-app notifications. Each row is a discrete item for ONE recipient.
-- Writes happen via service role (`createNotification` helper); the
-- recipient can SELECT their own and UPDATE only to set read_at.

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  url text,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_inbox_idx
  ON notifications (recipient_user_id, created_at DESC);

-- Unread-first feed: partial index so we can quickly count/show unread.
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON notifications (recipient_user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Recipient reads their own.
DROP POLICY IF EXISTS notifications_self_read ON notifications;
CREATE POLICY notifications_self_read ON notifications
  FOR SELECT
  USING (recipient_user_id = auth.uid() OR is_super_admin());

-- Recipient can only UPDATE to mark as read (toggling read_at).
-- We permit any update on their own rows; the server action enforces
-- "only read_at" semantics via the controlled update payload.
DROP POLICY IF EXISTS notifications_self_update ON notifications;
CREATE POLICY notifications_self_update ON notifications
  FOR UPDATE
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

-- No INSERT/DELETE policies — service role bypasses RLS. Inserts happen
-- from `createNotification()` using the admin client; deletes (cleanup
-- of old read rows) happen from a future pg_cron job as service role.
