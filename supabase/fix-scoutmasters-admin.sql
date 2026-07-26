-- Run once in Supabase SQL Editor if Scoutmaster add/edit fails from admin UI
-- https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new

-- Columns the app expects
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS years text;
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS submitted_by_email text;
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS admin_notes text;

-- Migrate legacy "title" column → years (if your table still has title)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scoutmasters' AND column_name = 'title'
  ) THEN
    UPDATE public.scoutmasters SET years = COALESCE(years, title, '—') WHERE years IS NULL;
  END IF;
END $$;

UPDATE public.scoutmasters SET years = COALESCE(years, '—') WHERE years IS NULL;

DO $$ BEGIN
  ALTER TABLE public.scoutmasters ALTER COLUMN years SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Admin + public suggestion policies
DROP POLICY IF EXISTS "Approved scoutmasters are public" ON public.scoutmasters;
DROP POLICY IF EXISTS "Anyone can suggest scoutmaster" ON public.scoutmasters;
DROP POLICY IF EXISTS "Anyone can suggest scoutmaster entries" ON public.scoutmasters;
DROP POLICY IF EXISTS "Admins manage scoutmasters" ON public.scoutmasters;

CREATE POLICY "Approved scoutmasters are public"
ON public.scoutmasters FOR SELECT TO anon, authenticated
USING (status = 'approved');

CREATE POLICY "Anyone can suggest scoutmaster entries"
ON public.scoutmasters FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pending');

CREATE POLICY "Admins manage scoutmasters"
ON public.scoutmasters FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.scoutmasters TO anon, authenticated;
GRANT INSERT ON public.scoutmasters TO anon, authenticated;

-- Photo uploads bucket
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
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'scoutmaster-photos');

CREATE POLICY "Admins upload scoutmaster photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'scoutmaster-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins update scoutmaster photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'scoutmaster-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'scoutmaster-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins delete scoutmaster photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'scoutmaster-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
