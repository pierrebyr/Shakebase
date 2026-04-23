-- Per-workspace user-activity tracking (PR 1 of 3).
--
-- One wide table + JSONB metadata. Readable only by workspace owners
-- (and the super admin via is_super_admin()). Every workspace member
-- can INSERT their own events into workspaces they have access to.
--
-- See the PR plan for the full design. Retention job + anonymization
-- trigger land in a separate migration.

create table activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  kind text not null,
  target_type text,
  target_id uuid,
  target_label text,
  metadata jsonb not null default '{}'::jsonb,
  session_id text,
  is_admin_impersonation boolean not null default false
);

comment on table activity_events is
  'User activity log (views, searches, clicks). Owner + super-admin readable.';

create index activity_events_ws_time_idx
  on activity_events (workspace_id, occurred_at desc);

create index activity_events_ws_kind_time_idx
  on activity_events (workspace_id, kind, occurred_at desc);

create index activity_events_ws_user_time_idx
  on activity_events (workspace_id, user_id, occurred_at desc);

create index activity_events_ws_target_idx
  on activity_events (workspace_id, target_type, target_id)
  where target_id is not null;

alter table activity_events enable row level security;

-- Owners see their workspace's events; super admin sees all.
-- Editors + viewers get no rows back.
create policy activity_events_read on activity_events for select
  using (
    current_workspace_role(workspace_id) = 'owner'
    or is_super_admin()
  );

-- Any workspace member can log their own events. The user_id check
-- ensures nobody can forge an event attributed to another user.
create policy activity_events_insert on activity_events for insert
  with check (
    user_id = auth.uid()
    and can_read_workspace(workspace_id)
  );

-- No UPDATE or DELETE policies: events are append-only from the
-- application's perspective. Retention + anonymization run via the
-- service-role key in a scheduled job (see later migration).
