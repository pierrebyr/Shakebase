-- Fixes for Supabase advisor findings:
--   1. function_search_path_mutable (WARN) — pin search_path on 3 functions.
--   2. auth_rls_initplan (WARN) — wrap auth.<fn>() in (select auth.<fn>())
--      so Postgres evaluates it once per query instead of once per row.
--   3. multiple_permissive_policies (WARN) — split each `*_write` FOR ALL
--      policy into INSERT/UPDATE/DELETE so only `*_read` covers SELECT.
--
-- Safe to run on a live workspace: policies are dropped + recreated atomically
-- inside each block, and the rewritten predicates are semantically identical.

-- ============================================================
-- 1. Pin search_path on SECURITY-sensitive helpers
-- ============================================================

ALTER FUNCTION public.can_read_workspace(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.can_write_workspace(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.touch_updated_at() SET search_path = public, pg_temp;

-- ============================================================
-- 2a. auth_rls_initplan fixes on single-policy tables
-- ============================================================

-- profiles
DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
CREATE POLICY profiles_self_select ON public.profiles
  FOR SELECT USING (id = (select auth.uid()) OR is_super_admin());

DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS profiles_self_insert ON public.profiles;
CREATE POLICY profiles_self_insert ON public.profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

-- notifications
DROP POLICY IF EXISTS notifications_self_read ON public.notifications;
CREATE POLICY notifications_self_read ON public.notifications
  FOR SELECT USING (recipient_user_id = (select auth.uid()) OR is_super_admin());

DROP POLICY IF EXISTS notifications_self_update ON public.notifications;
CREATE POLICY notifications_self_update ON public.notifications
  FOR UPDATE USING (recipient_user_id = (select auth.uid()))
  WITH CHECK (recipient_user_id = (select auth.uid()));

-- catalog_suggestions (insert policy)
DROP POLICY IF EXISTS catalog_suggestions_ws_insert ON public.catalog_suggestions;
CREATE POLICY catalog_suggestions_ws_insert ON public.catalog_suggestions
  FOR INSERT WITH CHECK (
    suggested_by_user_id = (select auth.uid())
    AND can_write_workspace(suggested_from_workspace_id)
  );

-- user_notification_prefs (single FOR ALL policy)
DROP POLICY IF EXISTS notif_prefs_self ON public.user_notification_prefs;
CREATE POLICY notif_prefs_self ON public.user_notification_prefs
  FOR ALL
  USING (user_id = (select auth.uid()) AND can_read_workspace(workspace_id))
  WITH CHECK (user_id = (select auth.uid()) AND can_read_workspace(workspace_id));

-- ============================================================
-- 2b + 3. For each table with `_read` (SELECT) + `_write` (FOR ALL):
--         drop the FOR ALL policy and re-create it as INSERT/UPDATE/DELETE
--         so only `_read` covers SELECT. Also fix auth.role() initplan on
--         global_ingredients / global_products reads.
-- ============================================================

-- ---- global_ingredients ----
DROP POLICY IF EXISTS global_ingredients_read ON public.global_ingredients;
CREATE POLICY global_ingredients_read ON public.global_ingredients
  FOR SELECT USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS global_ingredients_write ON public.global_ingredients;
CREATE POLICY global_ingredients_insert ON public.global_ingredients
  FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY global_ingredients_update ON public.global_ingredients
  FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY global_ingredients_delete ON public.global_ingredients
  FOR DELETE USING (is_super_admin());

-- ---- global_products ----
DROP POLICY IF EXISTS global_products_read ON public.global_products;
CREATE POLICY global_products_read ON public.global_products
  FOR SELECT USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS global_products_write ON public.global_products;
CREATE POLICY global_products_insert ON public.global_products
  FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY global_products_update ON public.global_products
  FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY global_products_delete ON public.global_products
  FOR DELETE USING (is_super_admin());

-- ---- cocktails ----
DROP POLICY IF EXISTS cocktails_write ON public.cocktails;
CREATE POLICY cocktails_insert ON public.cocktails
  FOR INSERT WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY cocktails_update ON public.cocktails
  FOR UPDATE USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY cocktails_delete ON public.cocktails
  FOR DELETE USING (can_write_workspace(workspace_id));

-- ---- cocktail_ingredients ----
DROP POLICY IF EXISTS cocktail_ingredients_write ON public.cocktail_ingredients;
CREATE POLICY cocktail_ingredients_insert ON public.cocktail_ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cocktails c
      WHERE c.id = cocktail_ingredients.cocktail_id
      AND can_write_workspace(c.workspace_id)
    )
  );
CREATE POLICY cocktail_ingredients_update ON public.cocktail_ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.cocktails c
      WHERE c.id = cocktail_ingredients.cocktail_id
      AND can_write_workspace(c.workspace_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cocktails c
      WHERE c.id = cocktail_ingredients.cocktail_id
      AND can_write_workspace(c.workspace_id)
    )
  );
CREATE POLICY cocktail_ingredients_delete ON public.cocktail_ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.cocktails c
      WHERE c.id = cocktail_ingredients.cocktail_id
      AND can_write_workspace(c.workspace_id)
    )
  );

-- ---- creators ----
DROP POLICY IF EXISTS creators_write ON public.creators;
CREATE POLICY creators_insert ON public.creators
  FOR INSERT WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY creators_update ON public.creators
  FOR UPDATE USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY creators_delete ON public.creators
  FOR DELETE USING (can_write_workspace(workspace_id));

-- ---- collections ----
DROP POLICY IF EXISTS collections_write ON public.collections;
CREATE POLICY collections_insert ON public.collections
  FOR INSERT WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY collections_update ON public.collections
  FOR UPDATE USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY collections_delete ON public.collections
  FOR DELETE USING (can_write_workspace(workspace_id));

-- ---- collection_cocktails ----
DROP POLICY IF EXISTS collection_cocktails_write ON public.collection_cocktails;
CREATE POLICY collection_cocktails_insert ON public.collection_cocktails
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_cocktails.collection_id
      AND can_write_workspace(c.workspace_id)
    )
  );
CREATE POLICY collection_cocktails_update ON public.collection_cocktails
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_cocktails.collection_id
      AND can_write_workspace(c.workspace_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_cocktails.collection_id
      AND can_write_workspace(c.workspace_id)
    )
  );
CREATE POLICY collection_cocktails_delete ON public.collection_cocktails
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_cocktails.collection_id
      AND can_write_workspace(c.workspace_id)
    )
  );

-- ---- workspace_products ----
DROP POLICY IF EXISTS workspace_products_write ON public.workspace_products;
CREATE POLICY workspace_products_insert ON public.workspace_products
  FOR INSERT WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY workspace_products_update ON public.workspace_products
  FOR UPDATE USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY workspace_products_delete ON public.workspace_products
  FOR DELETE USING (can_write_workspace(workspace_id));

-- ---- workspace_ingredients ----
DROP POLICY IF EXISTS workspace_ingredients_write ON public.workspace_ingredients;
CREATE POLICY workspace_ingredients_insert ON public.workspace_ingredients
  FOR INSERT WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY workspace_ingredients_update ON public.workspace_ingredients
  FOR UPDATE USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY workspace_ingredients_delete ON public.workspace_ingredients
  FOR DELETE USING (can_write_workspace(workspace_id));

-- ---- workspace_settings ----
DROP POLICY IF EXISTS workspace_settings_write ON public.workspace_settings;
CREATE POLICY workspace_settings_insert ON public.workspace_settings
  FOR INSERT WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY workspace_settings_update ON public.workspace_settings
  FOR UPDATE USING (can_write_workspace(workspace_id))
  WITH CHECK (can_write_workspace(workspace_id));
CREATE POLICY workspace_settings_delete ON public.workspace_settings
  FOR DELETE USING (can_write_workspace(workspace_id));

-- ---- memberships ----
DROP POLICY IF EXISTS memberships_write_owner ON public.memberships;
CREATE POLICY memberships_insert_owner ON public.memberships
  FOR INSERT WITH CHECK (current_workspace_role(workspace_id) = 'owner' OR is_super_admin());
CREATE POLICY memberships_update_owner ON public.memberships
  FOR UPDATE USING (current_workspace_role(workspace_id) = 'owner' OR is_super_admin())
  WITH CHECK (current_workspace_role(workspace_id) = 'owner' OR is_super_admin());
CREATE POLICY memberships_delete_owner ON public.memberships
  FOR DELETE USING (current_workspace_role(workspace_id) = 'owner' OR is_super_admin());

-- ---- user_cocktail_favorites ----
DROP POLICY IF EXISTS user_cocktail_favorites_select ON public.user_cocktail_favorites;
CREATE POLICY user_cocktail_favorites_select ON public.user_cocktail_favorites
  FOR SELECT USING (
    user_id = (select auth.uid()) AND can_read_workspace(workspace_id)
  );

DROP POLICY IF EXISTS user_cocktail_favorites_write ON public.user_cocktail_favorites;
CREATE POLICY user_cocktail_favorites_insert ON public.user_cocktail_favorites
  FOR INSERT WITH CHECK (
    user_id = (select auth.uid()) AND can_read_workspace(workspace_id)
  );
CREATE POLICY user_cocktail_favorites_update ON public.user_cocktail_favorites
  FOR UPDATE USING (
    user_id = (select auth.uid()) AND can_read_workspace(workspace_id)
  ) WITH CHECK (
    user_id = (select auth.uid()) AND can_read_workspace(workspace_id)
  );
CREATE POLICY user_cocktail_favorites_delete ON public.user_cocktail_favorites
  FOR DELETE USING (
    user_id = (select auth.uid()) AND can_read_workspace(workspace_id)
  );
