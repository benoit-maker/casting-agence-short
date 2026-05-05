-- ============================================
-- MIGRATION : Restaurer acces PM + ajouter 4 nouveaux champs
-- ============================================

-- 1. Restaurer l'acces SELECT/UPDATE aux PM (les PM gerent les candidatures)
DROP POLICY IF EXISTS "Super admin can view applications" ON applications;
DROP POLICY IF EXISTS "Super admin can update applications" ON applications;

CREATE POLICY "Authenticated can view applications" ON applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'project_manager')));

CREATE POLICY "Authenticated can update applications" ON applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'project_manager')));

-- DELETE reste super_admin uniquement (preserve la policy existante)

-- 2. Ajouter les 4 nouveaux champs
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepts_rate BOOLEAN,
  ADD COLUMN IF NOT EXISTS portfolio_link TEXT,
  ADD COLUMN IF NOT EXISTS micro_entrepreneur_status TEXT;

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepts_rate BOOLEAN,
  ADD COLUMN IF NOT EXISTS portfolio_link TEXT,
  ADD COLUMN IF NOT EXISTS micro_entrepreneur_status TEXT;

-- Validation des valeurs micro_entrepreneur_status
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_micro_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_micro_status_check
  CHECK (micro_entrepreneur_status IS NULL OR micro_entrepreneur_status IN ('yes', 'no', 'can_create'));

ALTER TABLE actors DROP CONSTRAINT IF EXISTS actors_micro_status_check;
ALTER TABLE actors ADD CONSTRAINT actors_micro_status_check
  CHECK (micro_entrepreneur_status IS NULL OR micro_entrepreneur_status IN ('yes', 'no', 'can_create'));
