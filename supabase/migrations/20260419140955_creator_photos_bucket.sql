-- Public read bucket for creator portraits. Writes go through service_role
-- from server actions.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('creator-photos', 'creator-photos', true)
  ON CONFLICT (id) DO NOTHING;
