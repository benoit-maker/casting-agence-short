-- Migration: split de la tranche "25-40 ans" en "25-34 ans" / "35-40 ans"
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)
--
-- Contexte : AGE_RANGES / computeAgeRanges (src/lib/types.ts, src/lib/utils.ts) ont été
-- mis à jour pour distinguer "25-34 ans" et "35-40 ans" au lieu de "25-40 ans". Cette
-- migration reclasse les acteurs déjà en base dont age_ranges contient encore "25-40 ans"
-- (colonne actors.age_ranges figée en écriture, non recalculée à l'affichage).
--
-- Diagnostic avant migration (lecture seule) :
--   75 acteurs ont "25-40 ans" + une date_of_birth renseignée -> reclassables automatiquement
--   63 acteurs ont "25-40 ans" + date_of_birth NULL (tous is_active = true) -> pas de donnée
--   pour trancher -> renommés en valeur legacy "25-40 ans (à préciser)"

BEGIN;

-- 1) Acteurs avec date_of_birth : recalcul complet des 6 tranches (pas seulement le split
--    25-34/35-40), pour couvrir le cas où l'âge aurait dérivé depuis la dernière sauvegarde
--    (ex. un acteur qui aurait entre-temps dépassé 40 ans). Reproduit exactement la logique
--    de computeAgeRanges() dans src/lib/utils.ts.
UPDATE actors
SET age_ranges = ARRAY[
  CASE
    WHEN floor((current_date - date_of_birth) / 365.25) < 18 THEN 'Moins de 18 ans'
    WHEN floor((current_date - date_of_birth) / 365.25) < 25 THEN '18-25 ans'
    WHEN floor((current_date - date_of_birth) / 365.25) < 35 THEN '25-34 ans'
    WHEN floor((current_date - date_of_birth) / 365.25) < 40 THEN '35-40 ans'
    WHEN floor((current_date - date_of_birth) / 365.25) < 55 THEN '40-55 ans'
    ELSE '55+'
  END
]
WHERE '25-40 ans' = ANY(age_ranges)
  AND date_of_birth IS NOT NULL;

-- 2) Acteurs sans date_of_birth : impossible de trancher automatiquement entre 25-34 et
--    35-40. On renomme l'entrée en valeur legacy "à préciser" (le tableau age_ranges est
--    conservé, seule cette entrée est remplacée) plutôt que de le vider, pour ne pas faire
--    disparaître ces 63 profils actifs des filtres/stats tant que leur date de naissance
--    n'est pas ressaisie. Dès qu'un admin renseigne date_of_birth et sauvegarde le profil
--    dans l'admin, computeAgeRanges() recalcule automatiquement la bonne tranche et écrase
--    cette valeur legacy.
UPDATE actors
SET age_ranges = array_replace(age_ranges, '25-40 ans', '25-40 ans (à préciser)')
WHERE '25-40 ans' = ANY(age_ranges)
  AND date_of_birth IS NULL;

-- Vérification (lecture seule) : ne doit plus rester aucune ligne avec l'ancien libellé
SELECT count(*) AS lignes_restantes_25_40
FROM actors WHERE '25-40 ans' = ANY(age_ranges);

COMMIT;
