-- Pre-aggregated view: one row per (workspace, ingredient) with usage count.
-- Feeds the /ingredients page so it doesn't have to pull every
-- cocktail_ingredients row and aggregate client-side.
--
-- security_invoker = true so the caller's RLS is respected — a user
-- only sees rows for workspaces they can read (via the join on cocktails
-- which has its own RLS policies).

CREATE OR REPLACE VIEW workspace_ingredient_usage
WITH (security_invoker = true) AS
SELECT
  c.workspace_id,
  ci.global_ingredient_id,
  ci.workspace_ingredient_id,
  COALESCE(gi.name, wi.name)         AS name,
  COALESCE(gi.category, wi.category) AS category,
  COUNT(*)::int                      AS usage_count
FROM cocktail_ingredients ci
JOIN cocktails             c  ON c.id  = ci.cocktail_id
LEFT JOIN global_ingredients   gi ON gi.id = ci.global_ingredient_id
LEFT JOIN workspace_ingredients wi ON wi.id = ci.workspace_ingredient_id
WHERE c.status <> 'archived'
  AND ci.global_product_id IS NULL
  AND (gi.name IS NOT NULL OR wi.name IS NOT NULL)
GROUP BY
  c.workspace_id,
  ci.global_ingredient_id,
  ci.workspace_ingredient_id,
  COALESCE(gi.name, wi.name),
  COALESCE(gi.category, wi.category);

-- Grant read to authenticated role (RLS on underlying tables still applies)
GRANT SELECT ON workspace_ingredient_usage TO authenticated;
