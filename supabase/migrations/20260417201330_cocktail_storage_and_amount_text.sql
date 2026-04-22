-- Free-text amount ("50 ml", "3 dashes", "Top") for cocktail ingredients.
-- Keeps structured amount (numeric) + unit for future parsing; amount_text
-- is the canonical user-visible value.
ALTER TABLE cocktail_ingredients ADD COLUMN IF NOT EXISTS amount_text text;

-- Public read bucket for cocktail hero images. Writes go through the
-- service role from server actions, so no write policies are needed here.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('cocktail-images', 'cocktail-images', true)
  ON CONFLICT (id) DO NOTHING;
