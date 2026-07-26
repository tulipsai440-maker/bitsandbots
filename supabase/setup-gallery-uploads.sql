-- Gallery photo uploads with admin review (run once in the Supabase SQL Editor)
-- =============================================================================
-- SQL Editor: https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new
--
-- How it works:
--   * Visitors upload into the PRIVATE 'gallery-pending' bucket. Nothing there is
--     publicly reachable — only admins can view it.
--   * On approval the photo is copied into the PUBLIC 'gallery-approved' bucket
--     and starts showing on /gallery.
--   * Rejecting deletes the pending file.

-- ========== Table ==========
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status public.content_status NOT NULL DEFAULT 'pending',
  pending_path text,
  approved_path text,
  caption text,
  width integer,
  height integer,
  submitted_by_name text,
  submitted_by_email text,
  consent_confirmed boolean NOT NULL DEFAULT false,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT ALL ON public.gallery_photos TO service_role;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- Only admins touch the table directly. The public goes through the two
-- SECURITY DEFINER functions below, which never expose submitter contact details.
DROP POLICY IF EXISTS "Admins manage gallery photos" ON public.gallery_photos;
CREATE POLICY "Admins manage gallery photos"
ON public.gallery_photos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_photos TO authenticated;

DROP TRIGGER IF EXISTS gallery_photos_set_updated_at ON public.gallery_photos;
CREATE TRIGGER gallery_photos_set_updated_at
BEFORE UPDATE ON public.gallery_photos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== Public read: approved photos only, no contact details ==========
CREATE OR REPLACE FUNCTION public.list_approved_gallery_photos()
RETURNS TABLE (
  id uuid,
  approved_path text,
  caption text,
  width integer,
  height integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.approved_path, g.caption, g.width, g.height, g.created_at
  FROM public.gallery_photos g
  WHERE g.status = 'approved' AND g.approved_path IS NOT NULL
  ORDER BY g.created_at DESC;
$$;

-- ========== Public write: always lands as 'pending' ==========
CREATE OR REPLACE FUNCTION public.submit_gallery_photo(
  p_pending_path text,
  p_caption text,
  p_submitted_by_name text,
  p_submitted_by_email text,
  p_consent_confirmed boolean,
  p_width integer,
  p_height integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF p_pending_path IS NULL OR length(trim(p_pending_path)) = 0 THEN
    RAISE EXCEPTION 'A photo file is required';
  END IF;

  IF p_consent_confirmed IS NOT TRUE THEN
    RAISE EXCEPTION 'Photo permission must be confirmed before uploading';
  END IF;

  IF p_submitted_by_name IS NULL OR length(trim(p_submitted_by_name)) = 0 THEN
    RAISE EXCEPTION 'Your name is required';
  END IF;

  IF p_submitted_by_email IS NULL OR p_submitted_by_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  INSERT INTO public.gallery_photos (
    status, pending_path, caption, width, height,
    submitted_by_name, submitted_by_email, consent_confirmed
  )
  VALUES (
    'pending', trim(p_pending_path), nullif(trim(coalesce(p_caption, '')), ''),
    p_width, p_height,
    trim(p_submitted_by_name), lower(trim(p_submitted_by_email)), true
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_approved_gallery_photos() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_gallery_photo(text, text, text, text, boolean, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_approved_gallery_photos() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_gallery_photo(text, text, text, text, boolean, integer, integer) TO anon, authenticated;

-- ========== Buckets ==========
-- Private: holds photos awaiting review.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery-pending', 'gallery-pending', false, 8388608,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public: holds approved photos shown on /gallery.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery-approved', 'gallery-approved', true, 8388608,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========== Storage policies: pending (private) ==========
DROP POLICY IF EXISTS "Anyone can upload pending gallery photos" ON storage.objects;
CREATE POLICY "Anyone can upload pending gallery photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'gallery-pending');

DROP POLICY IF EXISTS "Admins read pending gallery photos" ON storage.objects;
CREATE POLICY "Admins read pending gallery photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'gallery-pending'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins delete pending gallery photos" ON storage.objects;
CREATE POLICY "Admins delete pending gallery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-pending'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ========== Storage policies: approved (public) ==========
DROP POLICY IF EXISTS "Public read approved gallery photos" ON storage.objects;
CREATE POLICY "Public read approved gallery photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery-approved');

DROP POLICY IF EXISTS "Admins upload approved gallery photos" ON storage.objects;
CREATE POLICY "Admins upload approved gallery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-approved'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins delete approved gallery photos" ON storage.objects;
CREATE POLICY "Admins delete approved gallery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-approved'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
