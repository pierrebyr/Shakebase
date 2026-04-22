-- Allow super-admins to mark a workspace as 'gifted' — free forever, no
-- trial clock, no card required, no freeze. Used for comp'd brand
-- partners / friends of the house.
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_subscription_status_check;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_subscription_status_check
  CHECK (subscription_status IN (
    'pending_payment',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'frozen',
    'gifted'
  ));
