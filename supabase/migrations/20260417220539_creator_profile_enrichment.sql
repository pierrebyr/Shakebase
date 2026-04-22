-- Rich creator profile: pronouns, country, signature, philosophy, specialties,
-- languages, mentors, awards, competitions, certifications, career timeline,
-- press, book, socials, avatar hue. Matches the new ShakeBase design.
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS signature text,
  ADD COLUMN IF NOT EXISTS philosophy text,
  ADD COLUMN IF NOT EXISTS avatar_hue integer,
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mentors text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS awards jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS competitions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS career jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS press jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS book jsonb,
  ADD COLUMN IF NOT EXISTS socials jsonb DEFAULT '{}'::jsonb;
