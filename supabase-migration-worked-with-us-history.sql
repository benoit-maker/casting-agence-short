-- ============================================
-- MIGRATION: Historique "a tourné avec nous"
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS worked_with_us_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  marked_at TIMESTAMPTZ DEFAULT NOW()
);
