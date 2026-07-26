-- Troop Admins management (run once in the Supabase SQL Editor)
-- =============================================================
-- Adds three functions so admins can grant and remove admin access from
-- Admin → Troop Admins on the website, instead of running SQL every time.
--
-- SQL Editor: https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new
--
-- These run as SECURITY DEFINER (they can read auth.users), but each one first
-- checks that the CALLER is already an admin, so a regular signed-in account
-- cannot use them to promote itself.

-- List every registered account, with whether they are an admin.
CREATE OR REPLACE FUNCTION public.list_troop_users()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only troop admins can view accounts';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id = u.id AND r.role = 'admin'
    ),
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at IS NOT NULL
  FROM auth.users u
  ORDER BY u.email;
END;
$$;

-- Grant admin access to a registered account.
CREATE OR REPLACE FUNCTION public.grant_troop_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only troop admins can grant admin access';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Remove admin access. Cannot remove yourself, and never the last admin.
CREATE OR REPLACE FUNCTION public.revoke_troop_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only troop admins can remove admin access';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot remove your own admin access';
  END IF;

  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count <= 1 THEN
    RAISE EXCEPTION 'There must always be at least one admin';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = 'admin';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_troop_users() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.grant_troop_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_troop_admin(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_troop_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_troop_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_troop_admin(uuid) TO authenticated;
