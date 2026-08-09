-- Fill / refresh parent emails from the season roster.
-- Safe to re-run. Updates empty emails; inserts missing parent rows.
-- https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

CREATE OR REPLACE FUNCTION public._upsert_parent_contact(
  p_name_match text,
  p_parent_name text,
  p_relation text,
  p_email text,
  p_phone text,
  p_sort integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_member uuid;
  v_existing uuid;
BEGIN
  SELECT t.id INTO v_member
  FROM public.team_members t
  WHERE lower(t.name) LIKE '%' || lower(p_name_match) || '%'
  ORDER BY t.sort_order
  LIMIT 1;

  IF v_member IS NULL OR NULLIF(trim(p_parent_name), '') IS NULL THEN
    RETURN;
  END IF;

  SELECT c.id INTO v_existing
  FROM public.parent_contacts c
  WHERE c.team_member_id = v_member
    AND lower(c.parent_name) = lower(trim(p_parent_name))
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    UPDATE public.parent_contacts
    SET
      relation = COALESCE(NULLIF(trim(p_relation), ''), relation),
      email = COALESCE(NULLIF(trim(p_email), ''), email),
      phone = COALESCE(NULLIF(trim(p_phone), ''), phone),
      sort_order = p_sort,
      updated_at = now()
    WHERE id = v_existing;
  ELSE
    INSERT INTO public.parent_contacts (
      team_member_id, parent_name, relation, email, phone, sort_order
    ) VALUES (
      v_member,
      trim(p_parent_name),
      COALESCE(NULLIF(trim(p_relation), ''), 'Parent'),
      NULLIF(trim(p_email), ''),
      NULLIF(trim(p_phone), ''),
      p_sort
    );
  END IF;
END;
$$;

-- Harshitha
SELECT public._upsert_parent_contact('Harshitha', 'Naveen Palanichamy', 'Parent 1', 'naveenkpalanichamy@gmail.com', '713-492-1520', 1);
SELECT public._upsert_parent_contact('Harshitha', 'Aarthy Nagarajan', 'Parent 2', 'aarthy18689@gmail.com', '901-413-0249', 2);

-- Vihas
SELECT public._upsert_parent_contact('Vihas', 'Praveen kumar Koyyalamudi', 'Parent 1', 'Praveen.Koyyalamudi@gmail.com', '6309450808', 1);
SELECT public._upsert_parent_contact('Vihas', 'Krishna Tamminedi', 'Parent 2', 'Krishna.dilse@gmail.com', '3314540018', 2);

-- Trivarn / Joy
SELECT public._upsert_parent_contact('Trivarn', 'Suresh Bheemanapali', 'Parent 1', '', '239-206-9685', 1);
SELECT public._upsert_parent_contact('Trivarn', 'Sravanti Bheemanapali', 'Parent 2', '', '239-703-5327', 2);

-- Tejasri
SELECT public._upsert_parent_contact('Tejasri', 'Ram Pandiri', 'Parent 1', 'rkpandiri@gmail.com', '812-374-6462', 1);
SELECT public._upsert_parent_contact('Tejasri', 'Madhu Pandiri', 'Parent 2', 'mterli@gmail.com', '812-374-6461', 2);

-- Aarav
SELECT public._upsert_parent_contact('Aarav', 'Suyog Jalwankar', 'Parent 1', '', '', 1);
SELECT public._upsert_parent_contact('Aarav', 'Abhilasha Jalwankar', 'Parent 2', '', '239-219-3521', 2);

-- Aarohi
SELECT public._upsert_parent_contact('Aarohi', 'Suyog Jalwankar', 'Parent 1', '', '', 1);
SELECT public._upsert_parent_contact('Aarohi', 'Abhilasha Jalwankar', 'Parent 2', '', '239-219-3521', 2);

-- Alexander
SELECT public._upsert_parent_contact('Alexander', 'Jamie Zabala', 'Parent 1', '', '239-290-7141', 1);
SELECT public._upsert_parent_contact('Alexander', 'Olga Zabala', 'Parent 2', '', '202-306-9313', 2);

-- Unique parent emails helper used by Admin → Broadcast
CREATE OR REPLACE FUNCTION public.list_unique_parent_emails()
RETURNS TABLE (email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT lower(trim(c.email)) AS email
  FROM public.parent_contacts c
  WHERE c.email IS NOT NULL
    AND trim(c.email) <> ''
    AND position('@' in c.email) > 1
  ORDER BY 1;
$$;

REVOKE EXECUTE ON FUNCTION public.list_unique_parent_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_unique_parent_emails() TO authenticated;

DROP FUNCTION IF EXISTS public._upsert_parent_contact(text, text, text, text, text, integer);

NOTIFY pgrst, 'reload schema';

-- Preview unique emails (run after above):
-- SELECT * FROM public.list_unique_parent_emails();
