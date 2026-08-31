-- Migration: add manual completion override to castings table
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)
--
-- NULL  = statut "Terminé" calculé automatiquement (2 semaines après created_at)
-- true  = forcé manuellement sur "Terminé"
-- false = forcé manuellement sur "En cours"

ALTER TABLE castings
  ADD COLUMN IF NOT EXISTS completed_override BOOLEAN;
