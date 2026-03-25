-- ============================================
-- MIGRATION: Table candidatures (applications)
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  city TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('Femme', 'Homme')),
  email TEXT,
  phone TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: admin peut tout voir/gérer, public peut insérer
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut soumettre une candidature (INSERT)
CREATE POLICY "Anyone can submit application" ON applications FOR INSERT
  WITH CHECK (true);

-- Les admins authentifiés peuvent tout voir et gérer
CREATE POLICY "Authenticated can view applications" ON applications FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Authenticated can update applications" ON applications FOR UPDATE TO authenticated
  USING (true);
CREATE POLICY "Authenticated can delete applications" ON applications FOR DELETE TO authenticated
  USING (true);
