-- Migration: add origin column to actors table
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'fr'
  CHECK (origin IN ('fr', 'uae'));
