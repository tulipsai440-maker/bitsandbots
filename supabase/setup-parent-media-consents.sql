-- Parent photo & media consent submissions (public form → admin review)
-- Run: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

CREATE TABLE IF NOT EXISTS public.parent_media_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  -- Parent / guardian contact info (collect both; one signature is enough)
  mother_name text,
  mother_email text,
  mother_phone text,
  father_name text,
  father_email text,
  father_phone text,
  -- Electronic signature
  signed_by_name text NOT NULL,
  signed_by_relation text NOT NULL DEFAULT 'Parent',
  signature_date date NOT NULL,
  -- What they agreed to (fixed text on form at submit time)
  consent_version text NOT NULL DEFAULT '2026-media-v1',
  agrees_website boolean NOT NULL DEFAULT true,
  agrees_social_media boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parent_media_consents_member_idx
  ON public.parent_media_consents (team_member_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS parent_media_consents_one_per_member
  ON public.parent_media_consents (team_member_id);

-- Public read: which teammates already signed (ids only — safe for anon)
CREATE OR REPLACE FUNCTION public.list_media_consented_member_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT team_member_id FROM public.parent_media_consents;
$$;

GRANT EXECUTE ON FUNCTION public.list_media_consented_member_ids() TO anon, authenticated;

GRANT ALL ON public.parent_media_consents TO service_role;
GRANT SELECT ON public.parent_media_consents TO authenticated;

ALTER TABLE public.parent_media_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read media consents" ON public.parent_media_consents;
CREATE POLICY "Admins read media consents"
ON public.parent_media_consents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Inserts only via service role (server function) — no public direct insert

NOTIFY pgrst, 'reload schema';
