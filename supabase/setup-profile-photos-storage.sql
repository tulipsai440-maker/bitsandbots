-- Public photos for team members, coaches, and sponsors
-- Run: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Profile photos are publicly readable" ON storage.objects;
CREATE POLICY "Profile photos are publicly readable"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Authenticated users can update profile photos" ON storage.objects;
CREATE POLICY "Authenticated users can update profile photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Authenticated users can delete profile photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete profile photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-photos');
