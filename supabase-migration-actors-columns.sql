-- ============================================
-- MIGRATION: Colonnes manquantes sur la table actors
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brands TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
