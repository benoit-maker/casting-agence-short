-- ============================================
-- MIGRATION: Ajoute la colonne email sur la table actors
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT NULL;
