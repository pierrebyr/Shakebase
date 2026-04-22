-- Multi-image support for cocktails. `images` is the source of truth
-- (ordered array of public URLs). `image_url` stays populated with
-- images[0] so the library card thumb and older callers keep working.

ALTER TABLE cocktails ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';

-- Backfill: existing cocktails with a single image_url get a
-- single-entry images array so everything else can converge on `images`.
UPDATE cocktails
   SET images = ARRAY[image_url]::text[]
 WHERE image_url IS NOT NULL
   AND (array_length(images, 1) IS NULL OR array_length(images, 1) = 0);
