-- ============================================
-- MIGRATION: Historique des blacklists (motif + date, append-only)
-- Contrairement à worked_with_us_history, cette table n'est jamais purgée :
-- chaque blacklist crée une nouvelle ligne, le débacklistage ne la supprime pas
-- (nécessaire pour des stats hebdo/mensuelles fiables dans le temps).
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS blacklist_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('Indisponible', 'Inactif', 'Mauvais acting', 'Mauvais comportement', 'Autre')),
  reason_detail TEXT,
  blacklisted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
