-- When a membership is deleted (user removed from a workspace), null
-- out user_id on their activity_events for that workspace and stamp
-- metadata.removed_at. Preserves aggregate stats; scrubs attribution.
--
-- The FK on auth.users already does ON DELETE SET NULL — this trigger
-- handles the more common path: user stays in the system but leaves
-- one workspace.

create or replace function anonymize_activity_on_membership_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update activity_events
    set user_id = null,
        metadata = jsonb_set(
          coalesce(metadata, '{}'::jsonb),
          '{removed_at}',
          to_jsonb(now())
        )
    where workspace_id = old.workspace_id
      and user_id = old.user_id;
  return old;
end;
$$;

create trigger anonymize_activity_after_membership_delete
  after delete on memberships
  for each row
  execute function anonymize_activity_on_membership_delete();
