-- ============================================
-- MIGRATION: Champ "A déjà tourné avec nous" sur la table actors
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS has_worked_with_us BOOLEAN DEFAULT FALSE;
