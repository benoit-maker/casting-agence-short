-- ============================================
-- MIGRATION SECURITE — Durcissement RLS, Storage, RPC
-- A executer dans le SQL Editor de Supabase
-- ============================================

-- ==========================================
-- 1. DROP RPC vulnerable (anon pouvait modifier l'etat d'un casting)
-- ==========================================
DROP FUNCTION IF EXISTS select_actor_for_casting(TEXT, UUID);

-- ==========================================
-- 2. RLS applications : super_admin uniquement (sauf INSERT public pour /inscription)
-- ==========================================
DROP POLICY IF EXISTS "Authenticated can view applications" ON applications;
DROP POLICY IF EXISTS "Authenticated can update applications" ON applications;
DROP POLICY IF EXISTS "Authenticated can delete applications" ON applications;

CREATE POLICY "Super admin can view applications" ON applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Super admin can update applications" ON applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Super admin can delete applications" ON applications FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- (la policy "Anyone can submit application" pour INSERT est preservee pour /inscription)

-- ==========================================
-- 3. Storage : empecher les PM d'ecraser les fichiers existants
-- (UPDATE = super_admin uniquement, INSERT reste autorise pour ne pas casser l'admin)
-- ==========================================
DROP POLICY IF EXISTS "Authenticated can update actor photos" ON storage.objects;
CREATE POLICY "Super admin can update actor photos" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'actor-photos'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- INSERT reste mais avec contrainte de path (folder racine valide uniquement)
DROP POLICY IF EXISTS "Authenticated can upload actor photos" ON storage.objects;
CREATE POLICY "Authenticated can upload actor photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'actor-photos'
    AND (storage.foldername(name))[1] IN ('actors', 'applications')
  );

-- DELETE Storage : super_admin uniquement (pas de policy = tout interdit aux non-service-role)
DROP POLICY IF EXISTS "Super admin can delete actor photos" ON storage.objects;
CREATE POLICY "Super admin can delete actor photos" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'actor-photos'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ==========================================
-- 4. Desactiver l'auto-creation de profil au signup
-- (defense-in-depth : meme si signups sont reactives par erreur, pas de privilege)
-- Les profils sont desormais crees explicitement par /api/admin/create-user
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
