-- Fix: "cannot execute UPDATE in a read-only transaction"
-- Session helper was writing while called from STABLE (read-only) RPCs.
-- Run in SQL Editor, then try /assignments again.
-- https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

CREATE OR REPLACE FUNCTION public._member_session(p_token uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  o_member_id uuid;
BEGIN
  SELECT s.team_member_id INTO o_member_id
  FROM public.member_sessions s
  WHERE s.token = p_token
    AND s.expires_at > now();

  IF o_member_id IS NULL THEN
    RAISE EXCEPTION 'Session expired — enter your PIN again';
  END IF;

  RETURN o_member_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
