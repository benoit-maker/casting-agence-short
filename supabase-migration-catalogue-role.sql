-- ============================================
-- MIGRATION: Ajoute le role "catalogue" (lecture seule, page Acteurs uniquement)
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'project_manager', 'catalogue'));
