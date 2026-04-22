-- Link a cocktail to the specific bottle it's built on (from the global
-- catalog). For brand-owner tenants, this lets the "Base spirit" picker
-- surface their own products.
ALTER TABLE cocktails
  ADD COLUMN IF NOT EXISTS base_product_id uuid REFERENCES global_products ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS cocktails_base_product_idx ON cocktails (base_product_id);
