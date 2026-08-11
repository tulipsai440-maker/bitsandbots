-- Tenant-scoped RPCs (run after setup-multi-tenant.sql)
-- SQL Editor: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new
--
-- Replaces global RPCs that leaked rows across tenants.
-- Bits & Bots production tenant id (tenant #1):
--   a1111111-1111-1111-1111-111111111111

-- ========== Constants helper ==========

CREATE OR REPLACE FUNCTION public.bitsandbots_tenant_id()
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'a1111111-1111-1111-1111-111111111111'::uuid;
$$;

CREATE OR REPLACE FUNCTION public._coalesce_tenant_id(p_tenant_id uuid)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_tenant_id, public.bitsandbots_tenant_id());
$$;

-- ========== Drop legacy zero-arg / unscoped overloads ==========

DROP FUNCTION IF EXISTS public.list_site_images();
DROP FUNCTION IF EXISTS public.list_approved_gallery_photos();
DROP FUNCTION IF EXISTS public.submit_gallery_photo(text, text, text, text, boolean, integer, integer);
DROP FUNCTION IF EXISTS public.list_unique_parent_emails();
DROP FUNCTION IF EXISTS public.list_media_consented_member_ids();
DROP FUNCTION IF EXISTS public.list_assignment_roster();

-- ========== Site images ==========

CREATE OR REPLACE FUNCTION public.list_site_images(p_tenant_id uuid DEFAULT NULL)
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
  WHERE s.tenant_id = public._coalesce_tenant_id(p_tenant_id)
  ORDER BY s.key;
$$;

REVOKE EXECUTE ON FUNCTION public.list_site_images(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_site_images(uuid) TO anon, authenticated;

-- ========== Gallery ==========

CREATE OR REPLACE FUNCTION public.list_approved_gallery_photos(p_tenant_id uuid DEFAULT NULL)
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
  WHERE g.status = 'approved'
    AND g.approved_path IS NOT NULL
    AND g.tenant_id = public._coalesce_tenant_id(p_tenant_id)
  ORDER BY g.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.submit_gallery_photo(
  p_pending_path text,
  p_caption text,
  p_submitted_by_name text,
  p_submitted_by_email text,
  p_consent_confirmed boolean,
  p_width integer,
  p_height integer,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  v_tenant_id uuid := public._coalesce_tenant_id(p_tenant_id);
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
    submitted_by_name, submitted_by_email, consent_confirmed, tenant_id
  )
  VALUES (
    'pending', trim(p_pending_path), nullif(trim(coalesce(p_caption, '')), ''),
    p_width, p_height,
    trim(p_submitted_by_name), lower(trim(p_submitted_by_email)), true, v_tenant_id
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_approved_gallery_photos(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_gallery_photo(text, text, text, text, boolean, integer, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_approved_gallery_photos(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_gallery_photo(text, text, text, text, boolean, integer, integer, uuid) TO anon, authenticated;

-- ========== Parent emails / media consent ==========

CREATE OR REPLACE FUNCTION public.list_unique_parent_emails(p_tenant_id uuid DEFAULT NULL)
RETURNS TABLE (email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT lower(trim(c.email)) AS email
  FROM public.parent_contacts c
  JOIN public.team_members tm ON tm.id = c.team_member_id
  WHERE tm.tenant_id = public._coalesce_tenant_id(p_tenant_id)
    AND c.email IS NOT NULL
    AND trim(c.email) <> ''
    AND position('@' in c.email) > 1
  ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.list_media_consented_member_ids(p_tenant_id uuid DEFAULT NULL)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.team_member_id
  FROM public.parent_media_consents c
  JOIN public.team_members tm ON tm.id = c.team_member_id
  WHERE tm.tenant_id = public._coalesce_tenant_id(p_tenant_id);
$$;

REVOKE EXECUTE ON FUNCTION public.list_unique_parent_emails(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_unique_parent_emails(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.list_media_consented_member_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_media_consented_member_ids(uuid) TO anon, authenticated;

-- ========== Assignment roster ==========

CREATE OR REPLACE FUNCTION public.list_assignment_roster(p_tenant_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  has_pin boolean,
  sort_order int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    t.id,
    t.name,
    EXISTS (
      SELECT 1 FROM public.member_pins p WHERE p.team_member_id = t.id
    ) AS has_pin,
    t.sort_order
  FROM public.team_members t
  WHERE t.tenant_id = public._coalesce_tenant_id(p_tenant_id)
  ORDER BY t.sort_order ASC, t.name ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.list_assignment_roster(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_assignment_roster(uuid) TO anon, authenticated;

-- ========== Assignment admin RPCs — tenant-scoped auth ==========

CREATE OR REPLACE FUNCTION public.admin_reset_member_pin(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT tm.tenant_id INTO v_tenant_id
  FROM public.team_members tm
  WHERE tm.id = p_member_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF auth.uid() IS NULL OR NOT public.has_tenant_role(v_tenant_id, auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.member_sessions WHERE team_member_id = p_member_id;
  DELETE FROM public.member_pins WHERE team_member_id = p_member_id;
  DELETE FROM public.member_pin_attempts WHERE team_member_id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reopen_assignment_task(p_task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT tm.tenant_id INTO v_tenant_id
  FROM public.assignment_tasks t
  JOIN public.team_members tm ON tm.id = t.team_member_id
  WHERE t.id = p_task_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF NOT public.has_tenant_role(v_tenant_id, auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.assignment_tasks
  SET status = 'todo', updated_at = now()
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reopen_assignment(p_assignment_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_count int;
  v_tenant_id uuid;
BEGIN
  SELECT a.tenant_id INTO v_tenant_id
  FROM public.assignments a
  WHERE a.id = p_assignment_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Assignment not found';
  END IF;

  IF NOT public.has_tenant_role(v_tenant_id, auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.assignment_tasks
  SET status = 'todo', updated_at = now()
  WHERE assignment_id = p_assignment_id
    AND status = 'done';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_assignment_task_status(
  p_task_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT tm.tenant_id INTO v_tenant_id
  FROM public.assignment_tasks t
  JOIN public.team_members tm ON tm.id = t.team_member_id
  WHERE t.id = p_task_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF NOT public.has_tenant_role(v_tenant_id, auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_status NOT IN ('todo', 'doing', 'done') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.assignment_tasks
  SET status = p_status, updated_at = now()
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
