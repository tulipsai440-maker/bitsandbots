-- Assignment attachments (kid uploads → admin can view)
-- Run once: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

ALTER TABLE public.assignment_tasks
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-attachments',
  'assignment-attachments',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read assignment attachments" ON storage.objects;
CREATE POLICY "Public read assignment attachments"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'assignment-attachments');

-- Kids use PIN (anon key), so allow anon uploads into this bucket only
DROP POLICY IF EXISTS "Anyone can upload assignment attachments" ON storage.objects;
CREATE POLICY "Anyone can upload assignment attachments"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'assignment-attachments');

DROP POLICY IF EXISTS "Admins delete assignment attachments" ON storage.objects;
CREATE POLICY "Admins delete assignment attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'assignment-attachments'
  AND public.has_role(auth.uid(), 'admin')
);

DROP FUNCTION IF EXISTS public.list_my_assignment_tasks(uuid);

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
  attachment_url text,
  attachment_name text,
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
    t.attachment_url,
    t.attachment_name,
    t.updated_at
  FROM public.assignment_tasks t
  JOIN public.assignments a ON a.id = t.assignment_id
  WHERE t.team_member_id = v_member
  ORDER BY a.due_date ASC, a.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_my_assignment_tasks(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_assignment_tasks(uuid) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.update_my_assignment_task(uuid, uuid, text, text);

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

NOTIFY pgrst, 'reload schema';
