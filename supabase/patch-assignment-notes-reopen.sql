-- Require a note when kids update assignment tasks + admin reopen helpers
-- Run once: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

-- Kid update (with attachments — run after setup-assignment-attachments.sql)
CREATE OR REPLACE FUNCTION public.update_my_assignment_task(
  p_token uuid,
  p_task_id uuid,
  p_status text,
  p_note text DEFAULT '',
  p_attachment_url text DEFAULT NULL,
  p_attachment_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_member uuid;
BEGIN
  v_member := public._member_session(p_token);

  IF p_status NOT IN ('todo', 'doing', 'done') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  IF NULLIF(TRIM(COALESCE(p_note, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Please add a note before saving';
  END IF;

  UPDATE public.assignment_tasks
  SET
    status = p_status,
    note = TRIM(p_note),
    attachment_url = p_attachment_url,
    attachment_name = p_attachment_name,
    updated_at = now()
  WHERE id = p_task_id
    AND team_member_id = v_member;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_my_assignment_task(uuid, uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_assignment_task(uuid, uuid, text, text, text, text) TO anon, authenticated;

-- Kid update (legacy 4-arg signature if attachments patch not applied yet)
CREATE OR REPLACE FUNCTION public.update_my_assignment_task(
  p_token uuid,
  p_task_id uuid,
  p_status text,
  p_note text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_member uuid;
BEGIN
  v_member := public._member_session(p_token);

  IF p_status NOT IN ('todo', 'doing', 'done') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  IF NULLIF(TRIM(COALESCE(p_note, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Please add a note before saving';
  END IF;

  UPDATE public.assignment_tasks
  SET
    status = p_status,
    note = TRIM(p_note),
    updated_at = now()
  WHERE id = p_task_id
    AND team_member_id = v_member;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_my_assignment_task(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_assignment_task(uuid, uuid, text, text) TO anon, authenticated;

-- Admin: reopen one teammate task (typically done → todo)
CREATE OR REPLACE FUNCTION public.admin_reopen_assignment_task(p_task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
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

REVOKE EXECUTE ON FUNCTION public.admin_reopen_assignment_task(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reopen_assignment_task(uuid) TO authenticated;

-- Admin: reopen whole assignment — reset all done tasks to todo
CREATE OR REPLACE FUNCTION public.admin_reopen_assignment(p_assignment_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
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

REVOKE EXECUTE ON FUNCTION public.admin_reopen_assignment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reopen_assignment(uuid) TO authenticated;

-- Admin: set any task status (todo / doing / done)
CREATE OR REPLACE FUNCTION public.admin_set_assignment_task_status(
  p_task_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
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

REVOKE EXECUTE ON FUNCTION public.admin_set_assignment_task_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_assignment_task_status(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
