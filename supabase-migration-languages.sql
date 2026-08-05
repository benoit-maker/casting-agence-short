-- ============================================
-- MIGRATION: Ajoute le champ langues parlées (multi-valeurs) à applications et actors
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
