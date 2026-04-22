-- Richer creator profiles: job title, city (separate from venue), year joined.
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS joined_year text;
