-- Migration: add origin and age_range columns to applications table
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'fr'
  CHECK (origin IN ('fr', 'uae'));

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS age_range text
  CHECK (
    age_range IS NULL
    OR age_range IN ('18-25 ans', '25-40 ans', '40-55 ans', '55+')
  );
