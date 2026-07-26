-- Scoutmaster photo uploads (run once in SQL Editor)
-- https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new

ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS photo_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scoutmaster-photos',
  'scoutmaster-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read scoutmaster photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload scoutmaster photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins update scoutmaster photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete scoutmaster photos" ON storage.objects;

CREATE POLICY "Public read scoutmaster photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'scoutmaster-photos');

CREATE POLICY "Admins upload scoutmaster photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scoutmaster-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins update scoutmaster photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'scoutmaster-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'scoutmaster-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins delete scoutmaster photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scoutmaster-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
