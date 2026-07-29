-- Site image overrides for homepage hero and section photos (run once in Supabase SQL Editor)
-- SQL Editor: https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new
--
-- Admins upload replacements in Admin → Site Images. Public pages read overrides here
-- and fall back to bundled defaults in public/photos/site/ when no override exists.

CREATE TABLE IF NOT EXISTS public.site_images (
  key text PRIMARY KEY,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT ALL ON public.site_images TO service_role;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site images are publicly readable" ON public.site_images;
CREATE POLICY "Site images are publicly readable"
ON public.site_images FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage site images" ON public.site_images;
CREATE POLICY "Admins manage site images"
ON public.site_images FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_images TO authenticated;

DROP TRIGGER IF EXISTS site_images_set_updated_at ON public.site_images;
CREATE TRIGGER site_images_set_updated_at
BEFORE UPDATE ON public.site_images
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.list_site_images()
RETURNS TABLE (
  key text,
  public_url text,
  alt text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.key, s.public_url, s.alt, s.updated_at
  FROM public.site_images s
  ORDER BY s.key;
$$;

REVOKE EXECUTE ON FUNCTION public.list_site_images() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_site_images() TO anon, authenticated;

-- Public bucket for admin-managed site images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('site-images', 'site-images', true, 8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read site images" ON storage.objects;
CREATE POLICY "Public read site images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'site-images');

DROP POLICY IF EXISTS "Admins upload site images" ON storage.objects;
CREATE POLICY "Admins upload site images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins update site images" ON storage.objects;
CREATE POLICY "Admins update site images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins delete site images" ON storage.objects;
CREATE POLICY "Admins delete site images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
);
