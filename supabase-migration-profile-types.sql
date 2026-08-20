-- ============================================
-- MIGRATION: Remplace profile_type (single-select) par profile_types (multi-select)
-- Nouvelles valeurs : 'Acteurs', 'UGC', 'Whitelisting' (indépendantes, tableau)
-- Tous les acteurs existants démarrent avec profile_types = ['Acteurs'] uniquement,
-- quelle que soit leur ancienne valeur profile_type — UGC/Whitelisting sont ajoutés
-- manuellement au cas par cas ensuite.
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE actors ADD COLUMN IF NOT EXISTS profile_types TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS profile_types TEXT[] NOT NULL DEFAULT ARRAY['Acteurs'];

UPDATE actors SET profile_types = ARRAY['Acteurs'];
UPDATE applications SET profile_types = ARRAY['Acteurs'];

ALTER TABLE actors DROP CONSTRAINT IF EXISTS actors_profile_type_check;
ALTER TABLE actors DROP COLUMN IF EXISTS profile_type;
ALTER TABLE actors ADD CONSTRAINT actors_profile_types_check
  CHECK (profile_types <@ ARRAY['Acteurs', 'UGC', 'Whitelisting']::text[]);

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_profile_type_check;
ALTER TABLE applications DROP COLUMN IF EXISTS profile_type;
ALTER TABLE applications ADD CONSTRAINT applications_profile_types_check
  CHECK (profile_types <@ ARRAY['Acteurs', 'UGC', 'Whitelisting']::text[]);

-- Expose profile_types dans la RPC publique (casting public view), en excluant
-- "Whitelisting" qui ne doit jamais être visible côté client
CREATE OR REPLACE FUNCTION get_casting_by_slug(casting_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', c.id,
    'client_name', c.client_name,
    'project_name', c.project_name,
    'status', c.status,
    'selected_actor_id', c.selected_actor_id,
    'actors', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', a.id,
          'display_name', COALESCE(a.display_name, split_part(a.name, ' ', 1) || ' ' || LEFT(split_part(a.name, ' ', 2), 1) || '.'),
          'sex', a.sex,
          'age_ranges', a.age_ranges,
          'cities', a.cities,
          'profile_types', array_remove(a.profile_types, 'Whitelisting'),
          'photo_url', a.photo_url,
          'video_url', a.video_url,
          'video_urls', a.video_urls
        ) ORDER BY ca.position
      ), '[]'::json)
      FROM casting_actors ca
      JOIN actors a ON a.id = ca.actor_id
      WHERE ca.casting_id = c.id AND a.is_active = true AND a.is_blacklisted = false
    )
  )
  FROM castings c
  WHERE c.slug = casting_slug
    AND (c.expires_at IS NULL OR c.expires_at > NOW());
$$ LANGUAGE SQL SECURITY DEFINER;
