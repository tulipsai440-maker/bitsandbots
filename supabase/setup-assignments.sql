-- Bits & Bots — Team assignments (admin creates once → kids get copies)
-- Run in SQL Editor: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new
-- Requires: public.team_members, public.has_role, public.set_updated_at

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ========== Assignment templates (admin creates once) ==========
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  link_url text,
  due_date date NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assignments_due_date_idx ON public.assignments (due_date DESC);

-- Per-kid copy / progress for each assignment
CREATE TABLE IF NOT EXISTS public.assignment_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'doing', 'done')),
  note text NOT NULL DEFAULT '',
  attachment_url text,
  attachment_name text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS assignment_tasks_member_idx
  ON public.assignment_tasks (team_member_id);
CREATE INDEX IF NOT EXISTS assignment_tasks_assignment_idx
  ON public.assignment_tasks (assignment_id);

-- 4-digit PIN per teammate (hashed)
CREATE TABLE IF NOT EXISTS public.member_pins (
  team_member_id uuid PRIMARY KEY REFERENCES public.team_members(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Session after successful PIN login
CREATE TABLE IF NOT EXISTS public.member_sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS member_sessions_member_idx
  ON public.member_sessions (team_member_id);
CREATE INDEX IF NOT EXISTS member_sessions_expires_idx
  ON public.member_sessions (expires_at);

-- Simple PIN brute-force throttle
CREATE TABLE IF NOT EXISTS public.member_pin_attempts (
  team_member_id uuid PRIMARY KEY REFERENCES public.team_members(id) ON DELETE CASCADE,
  fail_count int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.assignments TO service_role;
GRANT ALL ON public.assignment_tasks TO service_role;
GRANT ALL ON public.member_pins TO service_role;
GRANT ALL ON public.member_sessions TO service_role;
GRANT ALL ON public.member_pin_attempts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_tasks TO authenticated;
GRANT SELECT, DELETE ON public.member_pins TO authenticated;
GRANT SELECT, DELETE ON public.member_sessions TO authenticated;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_pin_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage assignments" ON public.assignments;
CREATE POLICY "Admins manage assignments"
ON public.assignments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage assignment tasks" ON public.assignment_tasks;
CREATE POLICY "Admins manage assignment tasks"
ON public.assignment_tasks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage member pins" ON public.member_pins;
CREATE POLICY "Admins manage member pins"
ON public.member_pins FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage member sessions" ON public.member_sessions;
CREATE POLICY "Admins manage member sessions"
ON public.member_sessions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read pin attempts" ON public.member_pin_attempts;
CREATE POLICY "Admins read pin attempts"
ON public.member_pin_attempts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS assignments_set_updated_at ON public.assignments;
CREATE TRIGGER assignments_set_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS assignment_tasks_set_updated_at ON public.assignment_tasks;
CREATE TRIGGER assignment_tasks_set_updated_at
BEFORE UPDATE ON public.assignment_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== Helpers ==========
CREATE OR REPLACE FUNCTION public._assert_valid_pin(p_pin text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_pin IS NULL OR p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits';
  END IF;
END;
$$;

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

-- Roster for /assignments name picker (names only)
CREATE OR REPLACE FUNCTION public.list_assignment_roster()
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
  ORDER BY t.sort_order ASC, t.name ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.list_assignment_roster() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_assignment_roster() TO anon, authenticated;

-- First-time PIN set (only when no PIN yet)
CREATE OR REPLACE FUNCTION public.set_member_pin(
  p_member_id uuid,
  p_pin text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token uuid;
BEGIN
  PERFORM public._assert_valid_pin(p_pin);

  IF NOT EXISTS (SELECT 1 FROM public.team_members WHERE id = p_member_id) THEN
    RAISE EXCEPTION 'Teammate not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.member_pins WHERE team_member_id = p_member_id) THEN
    RAISE EXCEPTION 'PIN already set — ask a coach to reset it if you forgot';
  END IF;

  INSERT INTO public.member_pins (team_member_id, pin_hash)
  VALUES (p_member_id, crypt(p_pin, gen_salt('bf'::text)));

  DELETE FROM public.member_sessions WHERE team_member_id = p_member_id;

  INSERT INTO public.member_sessions (team_member_id, expires_at)
  VALUES (p_member_id, now() + interval '14 days')
  RETURNING token INTO v_token;

  DELETE FROM public.member_pin_attempts WHERE team_member_id = p_member_id;

  RETURN v_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_member_pin(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_pin(uuid, text) TO anon, authenticated;

-- PIN login → session token
CREATE OR REPLACE FUNCTION public.login_member_pin(
  p_member_id uuid,
  p_pin text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_token uuid;
  v_fails int;
  v_locked timestamptz;
BEGIN
  PERFORM public._assert_valid_pin(p_pin);

  SELECT fail_count, locked_until
  INTO v_fails, v_locked
  FROM public.member_pin_attempts
  WHERE team_member_id = p_member_id;

  IF v_locked IS NOT NULL AND v_locked > now() THEN
    RAISE EXCEPTION 'Too many attempts — try again later';
  END IF;

  SELECT pin_hash INTO v_hash
  FROM public.member_pins
  WHERE team_member_id = p_member_id;

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'Set a PIN first';
  END IF;

  IF v_hash <> crypt(p_pin, v_hash) THEN
    INSERT INTO public.member_pin_attempts (team_member_id, fail_count, locked_until, updated_at)
    VALUES (
      p_member_id,
      1,
      CASE WHEN 1 >= 8 THEN now() + interval '15 minutes' ELSE NULL END,
      now()
    )
    ON CONFLICT (team_member_id) DO UPDATE SET
      fail_count = CASE
        WHEN public.member_pin_attempts.locked_until IS NOT NULL
          AND public.member_pin_attempts.locked_until <= now()
        THEN 1
        ELSE public.member_pin_attempts.fail_count + 1
      END,
      locked_until = CASE
        WHEN (
          CASE
            WHEN public.member_pin_attempts.locked_until IS NOT NULL
              AND public.member_pin_attempts.locked_until <= now()
            THEN 1
            ELSE public.member_pin_attempts.fail_count + 1
          END
        ) >= 8 THEN now() + interval '15 minutes'
        ELSE NULL
      END,
      updated_at = now();

    RAISE EXCEPTION 'Incorrect PIN';
  END IF;

  DELETE FROM public.member_pin_attempts WHERE team_member_id = p_member_id;
  DELETE FROM public.member_sessions WHERE team_member_id = p_member_id;

  INSERT INTO public.member_sessions (team_member_id, expires_at)
  VALUES (p_member_id, now() + interval '14 days')
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.login_member_pin(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_member_pin(uuid, text) TO anon, authenticated;

-- Admin clears PIN so kid can set a new one
CREATE OR REPLACE FUNCTION public.admin_reset_member_pin(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.member_sessions WHERE team_member_id = p_member_id;
  DELETE FROM public.member_pins WHERE team_member_id = p_member_id;
  DELETE FROM public.member_pin_attempts WHERE team_member_id = p_member_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_reset_member_pin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_member_pin(uuid) TO authenticated;

-- Kid: list my tasks
CREATE OR REPLACE FUNCTION public.list_my_assignment_tasks(p_token uuid)
RETURNS TABLE (
  task_id uuid,
  assignment_id uuid,
  title text,
  description text,
  link_url text,
  due_date date,
  status text,
  note text,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_member uuid;
BEGIN
  v_member := public._member_session(p_token);

  RETURN QUERY
  SELECT
    t.id,
    a.id,
    a.title,
    a.description,
    a.link_url,
    a.due_date,
    t.status,
    t.note,
    t.updated_at
  FROM public.assignment_tasks t
  JOIN public.assignments a ON a.id = t.assignment_id
  WHERE t.team_member_id = v_member
  ORDER BY a.due_date ASC, a.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_my_assignment_tasks(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_assignment_tasks(uuid) TO anon, authenticated;

-- Kid: update status / note
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

-- Who am I (from session)
CREATE OR REPLACE FUNCTION public.my_assignment_profile(p_token uuid)
RETURNS TABLE (
  id uuid,
  name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_member uuid;
BEGIN
  v_member := public._member_session(p_token);

  RETURN QUERY
  SELECT t.id, t.name
  FROM public.team_members t
  WHERE t.id = v_member;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.my_assignment_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_assignment_profile(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.logout_member_session(p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  DELETE FROM public.member_sessions WHERE token = p_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.logout_member_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.logout_member_session(uuid) TO anon, authenticated;

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
