-- ============================================
-- MIGRATION: Date de naissance sur la table actors
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL;
