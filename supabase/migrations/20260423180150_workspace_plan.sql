-- Introduce a workspace-level plan discriminator so creator / starter /
-- studio / enterprise caps can be enforced server-side.
--
-- All existing workspaces default to 'studio' (the tier they've been
-- implicitly on since day one). Signup will set the plan explicitly
-- going forward.

alter table workspaces
  add column plan text not null default 'studio'
  check (plan in ('creator', 'starter', 'studio', 'enterprise'));

comment on column workspaces.plan is
  'Subscription tier: creator (free), starter ($99), studio ($399), enterprise (custom).';

create index workspaces_plan_idx on workspaces (plan);
