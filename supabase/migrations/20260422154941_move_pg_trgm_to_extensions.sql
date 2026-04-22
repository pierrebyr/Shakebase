-- Move pg_trgm out of the public schema per Supabase best practice.
-- No existing index uses it yet, so the relocation is lossless.
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
