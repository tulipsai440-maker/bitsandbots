-- Run once in Supabase SQL Editor so public suggestions + admin review work
-- https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional columns used by the app (safe if already present)
ALTER TABLE public.eagle_scouts ADD COLUMN IF NOT EXISTS submitted_by_email text;
ALTER TABLE public.eagle_scouts ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS years text;
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS submitted_by_email text;
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS admin_notes text;

DO $$ BEGIN
  ALTER TABLE public.eagle_scouts ALTER COLUMN year TYPE text USING year::text;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Eagle Scouts RLS
DROP POLICY IF EXISTS "Approved eagle scouts are public" ON public.eagle_scouts;
DROP POLICY IF EXISTS "Anyone can suggest eagle scout" ON public.eagle_scouts;
DROP POLICY IF EXISTS "Anyone can suggest eagle scout entries" ON public.eagle_scouts;
DROP POLICY IF EXISTS "Admins manage eagle scouts" ON public.eagle_scouts;

CREATE POLICY "Approved eagle scouts are public"
ON public.eagle_scouts FOR SELECT TO anon, authenticated
USING (status = 'approved');

CREATE POLICY "Anyone can suggest eagle scout entries"
ON public.eagle_scouts FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pending');

CREATE POLICY "Admins manage eagle scouts"
ON public.eagle_scouts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.eagle_scouts TO anon, authenticated;
GRANT INSERT ON public.eagle_scouts TO anon, authenticated;

-- Scoutmasters RLS
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
