-- Fix Eagle Scouts / Scoutmasters visibility (run once in SQL Editor)
-- Problem: combined SELECT policy calls has_role() for anon users → "permission denied"

-- Eagle Scouts policies
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

-- Scoutmasters policies
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
