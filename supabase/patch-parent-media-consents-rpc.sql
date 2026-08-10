-- Run once if parent_media_consents already exists (adds public id list for consent form dropdown)
-- https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

CREATE UNIQUE INDEX IF NOT EXISTS parent_media_consents_one_per_member
  ON public.parent_media_consents (team_member_id);

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

NOTIFY pgrst, 'reload schema';
