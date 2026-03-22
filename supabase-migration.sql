-- ============================================
-- MIGRATION: Casting Agence Short — Full Setup
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. Table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'project_manager' CHECK (role IN ('super_admin', 'project_manager')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table actors
CREATE TABLE IF NOT EXISTS actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT,
  sex TEXT NOT NULL CHECK (sex IN ('Femme', 'Homme')),
  age_ranges TEXT[] NOT NULL DEFAULT '{}',
  cities TEXT[] NOT NULL DEFAULT '{}',
  phone TEXT,
  rate TEXT,
  photo_url TEXT,
  video_url TEXT,
  notion_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table castings
CREATE TABLE IF NOT EXISTS castings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  project_name TEXT,
  project_manager_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'expired')),
  selected_actor_id UUID REFERENCES actors(id),
  selected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table casting_actors
CREATE TABLE IF NOT EXISTS casting_actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casting_id UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  UNIQUE(casting_id, actor_id)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_castings_slug ON castings(slug);
CREATE INDEX IF NOT EXISTS idx_castings_pm ON castings(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_casting_actors_casting ON casting_actors(casting_id);

-- 6. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE castings ENABLE ROW LEVEL SECURITY;
ALTER TABLE casting_actors ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Super admin can view all profiles" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Super admin can manage profiles" ON profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Actors
CREATE POLICY "Authenticated users can view active actors" ON actors FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Super admin can manage actors" ON actors FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Super admin can update actors" ON actors FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Super admin can delete actors" ON actors FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Castings
CREATE POLICY "PM can view own castings" ON castings FOR SELECT TO authenticated
  USING (project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "PM can create castings" ON castings FOR INSERT TO authenticated
  WITH CHECK (project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "PM can update own castings" ON castings FOR UPDATE TO authenticated
  USING (project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Casting actors
CREATE POLICY "View casting actors through casting access" ON casting_actors FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM castings c WHERE c.id = casting_id
    AND (c.project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
  ));
CREATE POLICY "Manage casting actors through casting access" ON casting_actors FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM castings c WHERE c.id = casting_id
    AND (c.project_manager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
  ));

-- 7. RPC publique : récupérer un casting par slug (accessible sans auth)
CREATE OR REPLACE FUNCTION get_casting_by_slug(casting_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', c.id,
    'client_name', c.client_name,
    'project_name', c.project_name,
    'status', c.status,
    'selected_actor_id', c.selected_actor_id,
    'actors', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', a.id,
          'display_name', COALESCE(a.display_name, split_part(a.name, ' ', 1) || ' ' || LEFT(split_part(a.name, ' ', 2), 1) || '.'),
          'sex', a.sex,
          'age_ranges', a.age_ranges,
          'cities', a.cities,
          'photo_url', a.photo_url,
          'video_url', a.video_url
        ) ORDER BY ca.position
      ), '[]'::json)
      FROM casting_actors ca
      JOIN actors a ON a.id = ca.actor_id
      WHERE ca.casting_id = c.id AND a.is_active = true
    )
  )
  FROM castings c
  WHERE c.slug = casting_slug
    AND (c.expires_at IS NULL OR c.expires_at > NOW());
$$ LANGUAGE SQL SECURITY DEFINER;

-- 8. RPC publique : sélectionner un acteur (accessible sans auth)
CREATE OR REPLACE FUNCTION select_actor_for_casting(casting_slug TEXT, actor_uuid UUID)
RETURNS JSON AS $$
DECLARE
  casting_record RECORD;
BEGIN
  SELECT c.id INTO casting_record
  FROM castings c
  JOIN casting_actors ca ON ca.casting_id = c.id
  WHERE c.slug = casting_slug AND ca.actor_id = actor_uuid
    AND (c.expires_at IS NULL OR c.expires_at > NOW());

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Casting ou acteur non trouvé');
  END IF;

  UPDATE castings SET
    selected_actor_id = actor_uuid,
    selected_at = NOW(),
    status = 'selected',
    updated_at = NOW()
  WHERE slug = casting_slug;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Storage bucket pour les photos acteurs
INSERT INTO storage.buckets (id, name, public) VALUES ('actor-photos', 'actor-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public can view actor photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'actor-photos');
CREATE POLICY "Authenticated can upload actor photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'actor-photos');
CREATE POLICY "Authenticated can update actor photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'actor-photos');

-- 10. Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actors_updated_at BEFORE UPDATE ON actors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER castings_updated_at BEFORE UPDATE ON castings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 11. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'project_manager');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
