-- ============================================
-- MIGRATION: Ajoute la blacklist acteurs (is_blacklisted)
-- Un acteur blackliste est invisible partout : liste admin principale,
-- profil public (/a/[id]), picker de casting, et vue casting publique.
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

ALTER TABLE actors
  ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE;

-- Exclut les acteurs blacklistés de la RPC publique (casting public view)
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
          'profile_type', a.profile_type,
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
