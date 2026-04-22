-- ShakeBase initial schema
-- Multi-tenant SaaS: workspaces + memberships + shared global catalog + private workspace data

-- =====================================================================
-- Extensions
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================================
-- Core tenant tables
-- =====================================================================

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name text NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  subscription_status text NOT NULL DEFAULT 'pending_payment'
    CHECK (subscription_status IN ('pending_payment','trialing','active','past_due','canceled','frozen')),
  trial_ends_at timestamptz,
  frozen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workspaces_slug_idx ON workspaces (slug);
CREATE INDEX workspaces_owner_idx ON workspaces (owner_user_id);
CREATE INDEX workspaces_status_idx ON workspaces (subscription_status);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','editor','viewer')),
  invited_by uuid REFERENCES auth.users,
  invitation_email text,
  invitation_token text UNIQUE,
  invitation_expires_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX memberships_workspace_user_idx
  ON memberships (workspace_id, user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX memberships_user_idx ON memberships (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX memberships_workspace_idx ON memberships (workspace_id);

CREATE TABLE super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  language text DEFAULT 'en',
  time_zone text DEFAULT 'Europe/Paris',
  job_title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- Global shared catalog
-- =====================================================================

CREATE TABLE global_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text,
  allergens text[] DEFAULT '{}',
  default_unit text DEFAULT 'ml',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE global_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  expression text NOT NULL,
  category text NOT NULL,
  abv numeric(4,2),
  origin text,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (brand, expression)
);
CREATE INDEX global_products_category_idx ON global_products (category);

-- =====================================================================
-- Workspace-private data
-- =====================================================================

CREATE TABLE creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  name text NOT NULL,
  bio text,
  venue text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX creators_workspace_idx ON creators (workspace_id);

CREATE TABLE workspace_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  default_unit text DEFAULT 'ml',
  UNIQUE (workspace_id, name)
);

CREATE TABLE workspace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  global_product_id uuid NOT NULL REFERENCES global_products,
  stock integer,
  par integer,
  cost_cents integer,
  notes text,
  UNIQUE (workspace_id, global_product_id)
);
CREATE INDEX workspace_products_workspace_idx ON workspace_products (workspace_id);

CREATE TABLE cocktails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','published','archived')),
  category text,
  spirit_base text,
  season text[] DEFAULT '{}',
  occasions text[] DEFAULT '{}',
  glass_type text,
  method_steps jsonb,
  tasting_notes text,
  flavor_profile text[] DEFAULT '{}',
  garnish text,
  venue text,
  event_origin text,
  cost_cents integer,
  menu_price_cents integer,
  currency text DEFAULT 'EUR',
  image_url text,
  orb_from text,
  orb_to text,
  creator_id uuid REFERENCES creators ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (workspace_id, slug)
);
CREATE INDEX cocktails_workspace_idx ON cocktails (workspace_id);
CREATE INDEX cocktails_workspace_status_idx ON cocktails (workspace_id, status);

CREATE TABLE cocktail_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cocktail_id uuid NOT NULL REFERENCES cocktails ON DELETE CASCADE,
  position integer NOT NULL,
  global_ingredient_id uuid REFERENCES global_ingredients,
  global_product_id uuid REFERENCES global_products,
  workspace_ingredient_id uuid REFERENCES workspace_ingredients ON DELETE SET NULL,
  custom_name text,
  amount numeric(6,2),
  unit text,
  notes text,
  CHECK (
    num_nonnulls(global_ingredient_id, global_product_id, workspace_ingredient_id, custom_name) >= 1
  )
);
CREATE INDEX cocktail_ingredients_cocktail_idx ON cocktail_ingredients (cocktail_id);

-- =====================================================================
-- Settings & audit
-- =====================================================================

CREATE TABLE workspace_settings (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces ON DELETE CASCADE,
  default_units text DEFAULT 'metric' CHECK (default_units IN ('metric','imperial','both')),
  default_view text DEFAULT 'grid' CHECK (default_view IN ('grid','list')),
  autosave boolean DEFAULT true,
  show_costs boolean DEFAULT true,
  theme text DEFAULT 'light' CHECK (theme IN ('light','dark','system')),
  accent text DEFAULT '#c49155',
  density text DEFAULT 'comfortable' CHECK (density IN ('comfortable','compact')),
  typography text DEFAULT 'technical' CHECK (typography IN ('default','editorial','technical')),
  reduce_motion boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE user_notification_prefs (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE,
  submissions boolean DEFAULT true,
  mentions boolean DEFAULT true,
  digest boolean DEFAULT true,
  stock_alerts boolean DEFAULT true,
  channel text DEFAULT 'in-app' CHECK (channel IN ('email','in-app','both')),
  PRIMARY KEY (user_id, workspace_id)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX audit_logs_workspace_created_idx ON audit_logs (workspace_id, created_at DESC);

CREATE TABLE stripe_webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  workspace_id uuid REFERENCES workspaces ON DELETE SET NULL,
  processed_at timestamptz DEFAULT now(),
  payload jsonb
);

-- =====================================================================
-- Auth helper functions (used by RLS policies)
-- =====================================================================

CREATE OR REPLACE FUNCTION current_workspace_role(ws uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM memberships
  WHERE workspace_id = ws
    AND user_id = auth.uid()
    AND joined_at IS NOT NULL
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM super_admins WHERE user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION can_read_workspace(ws uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT current_workspace_role(ws) IS NOT NULL OR is_super_admin()
$$;

CREATE OR REPLACE FUNCTION can_write_workspace(ws uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT current_workspace_role(ws) IN ('owner','editor') OR is_super_admin()
$$;

-- =====================================================================
-- Row-level security
-- =====================================================================

ALTER TABLE workspaces              ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships             ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_ingredients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktails               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_ingredients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_ingredients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;

-- --- workspaces ----------------------------------------------------
CREATE POLICY workspaces_select ON workspaces FOR SELECT
  USING (can_read_workspace(id));

-- owner may update profile-level fields; billing columns only via service_role
CREATE POLICY workspaces_update_owner ON workspaces FOR UPDATE
  USING (current_workspace_role(id) = 'owner' OR is_super_admin());

-- --- memberships ---------------------------------------------------
CREATE POLICY memberships_select_same_workspace ON memberships FOR SELECT
  USING (can_read_workspace(workspace_id));

CREATE POLICY memberships_write_owner ON memberships FOR ALL
  USING (current_workspace_role(workspace_id) = 'owner' OR is_super_admin())
  WITH CHECK (current_workspace_role(workspace_id) = 'owner' OR is_super_admin());

-- --- super_admins (no one reads/writes via client; service_role only) ---
CREATE POLICY super_admins_noop_select ON super_admins FOR SELECT USING (false);

-- --- profiles ------------------------------------------------------
CREATE POLICY profiles_self_select ON profiles FOR SELECT
  USING (id = auth.uid() OR is_super_admin());
CREATE POLICY profiles_self_update ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
CREATE POLICY profiles_self_insert ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- --- global_ingredients / global_products --------------------------
CREATE POLICY global_ingredients_read ON global_ingredients FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY global_ingredients_write ON global_ingredients FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY global_products_read ON global_products FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY global_products_write ON global_products FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- --- creators ------------------------------------------------------
CREATE POLICY creators_read ON creators FOR SELECT
  USING (can_read_workspace(workspace_id));
CREATE POLICY creators_write ON creators FOR ALL
  USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));

-- --- cocktails -----------------------------------------------------
CREATE POLICY cocktails_read ON cocktails FOR SELECT
  USING (can_read_workspace(workspace_id));
CREATE POLICY cocktails_write ON cocktails FOR ALL
  USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));

-- --- cocktail_ingredients (inherits cocktail's workspace) ---------
CREATE POLICY cocktail_ingredients_read ON cocktail_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM cocktails c
    WHERE c.id = cocktail_id AND can_read_workspace(c.workspace_id)
  ));
CREATE POLICY cocktail_ingredients_write ON cocktail_ingredients FOR ALL
  USING (EXISTS (
    SELECT 1 FROM cocktails c
    WHERE c.id = cocktail_id AND can_write_workspace(c.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM cocktails c
    WHERE c.id = cocktail_id AND can_write_workspace(c.workspace_id)
  ));

-- --- workspace_ingredients ----------------------------------------
CREATE POLICY workspace_ingredients_read ON workspace_ingredients FOR SELECT
  USING (can_read_workspace(workspace_id));
CREATE POLICY workspace_ingredients_write ON workspace_ingredients FOR ALL
  USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));

-- --- workspace_products -------------------------------------------
CREATE POLICY workspace_products_read ON workspace_products FOR SELECT
  USING (can_read_workspace(workspace_id));
CREATE POLICY workspace_products_write ON workspace_products FOR ALL
  USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));

-- --- workspace_settings -------------------------------------------
CREATE POLICY workspace_settings_read ON workspace_settings FOR SELECT
  USING (can_read_workspace(workspace_id));
CREATE POLICY workspace_settings_write ON workspace_settings FOR ALL
  USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));

-- --- user_notification_prefs (self-scoped) ------------------------
CREATE POLICY notif_prefs_self ON user_notification_prefs FOR ALL
  USING (user_id = auth.uid() AND can_read_workspace(workspace_id))
  WITH CHECK (user_id = auth.uid() AND can_read_workspace(workspace_id));

-- --- audit_logs ---------------------------------------------------
CREATE POLICY audit_logs_read ON audit_logs FOR SELECT
  USING (can_read_workspace(workspace_id));
-- no INSERT policy on audit_logs — written by service_role only

-- =====================================================================
-- Updated-at trigger
-- =====================================================================

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER workspaces_touch BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER cocktails_touch BEFORE UPDATE ON cocktails
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER workspace_settings_touch BEFORE UPDATE ON workspace_settings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- Auto-create profile on signup
-- =====================================================================

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
