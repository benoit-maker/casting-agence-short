-- ============================================
-- MIGRATION: Source de recrutement des acteurs
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE applications ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE actors       ADD COLUMN IF NOT EXISTS referral_source TEXT;
