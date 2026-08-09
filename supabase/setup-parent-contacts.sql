-- Parent / participant contact info — ADMIN ONLY (not shown on public site)
-- Run: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new
-- Requires: public.team_members, public.has_role, public.set_updated_at

-- Kid contact + DOB (one row per teammate)
CREATE TABLE IF NOT EXISTS public.participant_details (
  team_member_id uuid PRIMARY KEY REFERENCES public.team_members(id) ON DELETE CASCADE,
  email text,
  phone text,
  date_of_birth date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Parents / guardians linked to a kid
CREATE TABLE IF NOT EXISTS public.parent_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  parent_name text NOT NULL,
  relation text NOT NULL DEFAULT 'Parent',
  phone text,
  email text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parent_contacts_member_idx
  ON public.parent_contacts (team_member_id, sort_order);

GRANT ALL ON public.participant_details TO service_role;
GRANT ALL ON public.parent_contacts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participant_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_contacts TO authenticated;

ALTER TABLE public.participant_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage participant details" ON public.participant_details;
CREATE POLICY "Admins manage participant details"
ON public.participant_details FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage parent contacts" ON public.parent_contacts;
CREATE POLICY "Admins manage parent contacts"
ON public.parent_contacts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS participant_details_set_updated_at ON public.participant_details;
CREATE TRIGGER participant_details_set_updated_at
BEFORE UPDATE ON public.participant_details
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS parent_contacts_set_updated_at ON public.parent_contacts;
CREATE TRIGGER parent_contacts_set_updated_at
BEFORE UPDATE ON public.parent_contacts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ensure every teammate has a participant_details row
INSERT INTO public.participant_details (team_member_id)
SELECT t.id
FROM public.team_members t
WHERE NOT EXISTS (
  SELECT 1 FROM public.participant_details d WHERE d.team_member_id = t.id
);

-- ========== Seed roster (one-time; skips kids who already have parents) ==========
-- Matches team_members by first/last name (handles nicknames like Joy / Alok).

CREATE OR REPLACE FUNCTION public._seed_family_for_kid(
  p_name_match text,
  p_email text,
  p_phone text,
  p_dob date,
  p_p1_name text,
  p_p1_email text,
  p_p1_phone text,
  p_p2_name text,
  p_p2_email text,
  p_p2_phone text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT t.id INTO v_id
  FROM public.team_members t
  WHERE lower(t.name) LIKE '%' || lower(p_name_match) || '%'
  ORDER BY t.sort_order
  LIMIT 1;

  IF v_id IS NULL THEN
    RAISE NOTICE 'No team member matched: %', p_name_match;
    RETURN;
  END IF;

  INSERT INTO public.participant_details (team_member_id, email, phone, date_of_birth)
  VALUES (
    v_id,
    NULLIF(trim(p_email), ''),
    NULLIF(trim(p_phone), ''),
    p_dob
  )
  ON CONFLICT (team_member_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.participant_details.email),
    phone = COALESCE(EXCLUDED.phone, public.participant_details.phone),
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, public.participant_details.date_of_birth),
    updated_at = now();

  -- Only seed parents if this kid has none yet
  IF EXISTS (SELECT 1 FROM public.parent_contacts WHERE team_member_id = v_id) THEN
    RETURN;
  END IF;

  IF NULLIF(trim(p_p1_name), '') IS NOT NULL THEN
    INSERT INTO public.parent_contacts (team_member_id, parent_name, relation, email, phone, sort_order)
    VALUES (
      v_id,
      trim(p_p1_name),
      'Parent 1',
      NULLIF(trim(p_p1_email), ''),
      NULLIF(trim(p_p1_phone), ''),
      1
    );
  END IF;

  IF NULLIF(trim(p_p2_name), '') IS NOT NULL THEN
    INSERT INTO public.parent_contacts (team_member_id, parent_name, relation, email, phone, sort_order)
    VALUES (
      v_id,
      trim(p_p2_name),
      'Parent 2',
      NULLIF(trim(p_p2_email), ''),
      NULLIF(trim(p_p2_phone), ''),
      2
    );
  END IF;
END;
$$;

SELECT public._seed_family_for_kid(
  'Harshitha',
  '',
  '',
  DATE '2012-11-05',
  'Naveen Palanichamy', 'naveenkpalanichamy@gmail.com', '713-492-1520',
  'Aarthy Nagarajan', 'aarthy18689@gmail.com', '901-413-0249'
);

SELECT public._seed_family_for_kid(
  'Vihas',
  '',
  '',
  DATE '2013-12-09',
  'Praveen kumar Koyyalamudi', 'Praveen.Koyyalamudi@gmail.com', '6309450808',
  'Krishna Tamminedi', 'Krishna.dilse@gmail.com', '3314540018'
);

SELECT public._seed_family_for_kid(
  'Trivarn',
  '',
  '',
  DATE '2014-01-25',
  'Suresh Bheemanapali', '', '239-206-9685',
  'Sravanti Bheemanapali', '', '239-703-5327'
);

SELECT public._seed_family_for_kid(
  'Tejasri',
  'mterli@gmail.com',
  '812.374.6461',
  DATE '2014-03-20',
  'Ram Pandiri', 'rkpandiri@gmail.com', '812-374-6462',
  'Madhu Pandiri', 'mterli@gmail.com', '812-374-6461'
);

SELECT public._seed_family_for_kid(
  'Aarav',
  '',
  '',
  DATE '2014-04-05',
  'Suyog Jalwankar', '', '',
  'Abhilasha Jalwankar', '', '239-219-3521'
);

SELECT public._seed_family_for_kid(
  'Aarohi',
  '',
  '',
  DATE '2014-04-05',
  'Suyog Jalwankar', '', '',
  'Abhilasha Jalwankar', '', '239-219-3521'
);

SELECT public._seed_family_for_kid(
  'Alexander',
  '',
  '',
  DATE '2014-07-22',
  'Jamie Zabala', '', '239-290-7141',
  'Olga Zabala', '', '202-306-9313'
);

DROP FUNCTION IF EXISTS public._seed_family_for_kid(text, text, text, date, text, text, text, text, text, text);

NOTIFY pgrst, 'reload schema';
