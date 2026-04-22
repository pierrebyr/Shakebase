-- Enrich global_products with marketing + inventory fields
ALTER TABLE global_products
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS tasting_notes text,
  ADD COLUMN IF NOT EXISTS volume_ml integer,
  ADD COLUMN IF NOT EXISTS suggested_cost_cents integer,
  ADD COLUMN IF NOT EXISTS suggested_price_cents integer,
  ADD COLUMN IF NOT EXISTS color_hex text,
  ADD COLUMN IF NOT EXISTS provenance jsonb;

-- Workspace-specific override of the menu price per bottle
ALTER TABLE workspace_products
  ADD COLUMN IF NOT EXISTS menu_price_cents integer;

-- ------------------------------------------------------------------
-- Casa Dragones portfolio — full data from the design spec
-- ------------------------------------------------------------------
UPDATE global_products SET
  tagline = 'The original. A sipping tequila crafted for purity and complexity.',
  tasting_notes = 'Small-batch joven blending silver tequila with extra-añejo. Vanilla, hazelnut, pear, and a subtle smoke. Served neat at room temperature.',
  volume_ml = 750,
  suggested_cost_cents = 14500,
  suggested_price_cents = 29500,
  color_hex = '#efe6c9',
  provenance = jsonb_build_object(
    'agave', '100% Blue Weber',
    'batch', 'SB-0412',
    'water_source', 'Volcanic spring, Jalisco',
    'distillery', 'Casa Dragones, Tequila',
    'maturation', '8–10 year agave'
  )
WHERE brand = 'Casa Dragones' AND expression = 'Joven';

UPDATE global_products SET
  tagline = 'A platinum sipping tequila with a crisp, herbal finish.',
  tasting_notes = 'Bright, clean and unmistakably agave forward. Notes of citrus peel, green pepper, and a whisper of mint. Excellent stirred, equally at home neat.',
  volume_ml = 750,
  suggested_cost_cents = 7000,
  suggested_price_cents = 13500,
  color_hex = '#ebe8d5',
  provenance = jsonb_build_object(
    'agave', '100% Blue Weber',
    'batch', 'SB-0187',
    'water_source', 'Volcanic spring, Jalisco',
    'distillery', 'Casa Dragones, Tequila',
    'maturation', '8–10 year agave'
  )
WHERE brand = 'Casa Dragones' AND expression = 'Blanco';

UPDATE global_products SET
  tagline = 'Aged in rare Japanese Mizunara oak. A first in tequila.',
  tasting_notes = 'Eight months in hand-selected Mizunara. Layered sandalwood, coconut, baked apple and a long oriental-spice finish. A measured sip.',
  volume_ml = 750,
  suggested_cost_cents = 22000,
  suggested_price_cents = 42500,
  color_hex = '#dcc48a',
  provenance = jsonb_build_object(
    'agave', '100% Blue Weber',
    'batch', 'SB-0098',
    'water_source', 'Volcanic spring, Jalisco',
    'distillery', 'Casa Dragones, Tequila · Aged in Japan',
    'maturation', '8 months Mizunara oak'
  )
WHERE brand = 'Casa Dragones' AND expression = 'Reposado Mizunara';

UPDATE global_products SET
  tagline = 'Small batch, barrel-blended. Rich, balanced, quietly complex.',
  tasting_notes = 'A marriage of new American and French oak casks. Dried fig, hazelnut, toffee and orange peel, with a clean, silky finish.',
  volume_ml = 750,
  suggested_cost_cents = 18000,
  suggested_price_cents = 34500,
  color_hex = '#c99858',
  provenance = jsonb_build_object(
    'agave', '100% Blue Weber',
    'batch', 'SB-0221',
    'water_source', 'Volcanic spring, Jalisco',
    'distillery', 'Casa Dragones, Tequila',
    'maturation', 'New American + French oak'
  )
WHERE brand = 'Casa Dragones' AND expression = 'Añejo Barrel Blend';

UPDATE global_products SET
  tagline = 'A higher-proof expression of the Blanco. Bold, crystalline, uncompromised.',
  tasting_notes = 'Bottled at 48% for bartender reserve. Amplifies the agave core — citrus oil, white pepper and mineral salinity. Shines in stirred builds.',
  volume_ml = 750,
  suggested_cost_cents = 9500,
  suggested_price_cents = 18000,
  color_hex = '#e5dfc2',
  provenance = jsonb_build_object(
    'agave', '100% Blue Weber',
    'batch', 'SB-0311',
    'water_source', 'Volcanic spring, Jalisco',
    'distillery', 'Casa Dragones, Tequila',
    'maturation', 'Cask strength'
  )
WHERE brand = 'Casa Dragones' AND expression = 'Blanco Cask-Strength';

-- Default volume for remaining bottles so cost/pour math works
UPDATE global_products SET volume_ml = 750 WHERE volume_ml IS NULL;
