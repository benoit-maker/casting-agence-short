-- ============================================
-- MIGRATION: Ajoute la colonne cities (multi-villes) à applications
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS cities TEXT[] DEFAULT '{}';

-- Backfill : remplir cities avec [city] pour les anciennes candidatures
UPDATE applications
SET cities = ARRAY[city]
WHERE (cities IS NULL OR array_length(cities, 1) IS NULL)
  AND city IS NOT NULL;

-- city devient optionnel (conservé pour compatibilité)
ALTER TABLE applications ALTER COLUMN city DROP NOT NULL;
