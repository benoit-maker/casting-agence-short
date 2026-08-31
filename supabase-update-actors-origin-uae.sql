-- Rattrapage manuel : marque les acteurs déjà en base (villes UAE) comme origin = 'uae'
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)

UPDATE actors
SET origin = 'uae'
WHERE name IN (
  'Milad Salami',
  'Marine Pedroso',
  'Inès  Zoubir',
  'Amine Katim',
  'Saliq Khan',
  'Anastasia Sukhikh',
  'Casey Shannon'
);
