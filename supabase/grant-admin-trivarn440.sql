-- Grant admin to trivarn440@gmail.com (Bits & Bots)

-- Project: njhiqsbykiggxqkjrxse

-- Dashboard SQL Editor:

--   https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

--

-- PASSWORD DOES NOT MATTER for admin access.

--   Password only lets the user sign in at /auth.

--   Admin access is ONLY: public.user_roles.role = 'admin'

--   for that user's auth.users.id.

--

-- Prerequisites:

--   1. User must already exist in auth.users (sign up at /auth first).

--   2. public.app_role + public.user_roles must exist

--      (run supabase/bootstrap-new-project.sql once if missing).

--

-- If step 1 returns 0 rows → sign up at http://localhost:8080/auth first,

--   then re-run this file. If email confirm blocks login, also run

--   supabase/confirm-user-trivarn440.sql

-- If INSERT fails with "type app_role does not exist" or

--   "relation user_roles does not exist" → run bootstrap-new-project.sql first.

--

-- ========== VERIFY STEPS (after running) ==========

-- A) Step 1 below returns 1 row for trivarn440@gmail.com

-- B) Step 3 returns 1 row with role = admin

-- C) Sign in at /auth as trivarn440@gmail.com (any working password)

-- D) Open /admin/calendar (or any admin page) and refresh

-- E) If still blocked: confirm you are signed in as THAT email

--    (not a different account), then re-run step 3 SELECT



-- ========== 0) (Optional) Minimal roles bootstrap if missing ==========

-- Safe to re-run: only creates objects when they do not exist.

DO $$

BEGIN

  IF NOT EXISTS (

    SELECT 1 FROM pg_type t

    JOIN pg_namespace n ON n.oid = t.typnamespace

    WHERE n.nspname = 'public' AND t.typname = 'app_role'

  ) THEN

    CREATE TYPE public.app_role AS ENUM ('admin', 'user');

  END IF;

END $$;



CREATE TABLE IF NOT EXISTS public.user_roles (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  role public.app_role NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, role)

);



GRANT SELECT ON public.user_roles TO authenticated;

GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;



DO $$

BEGIN

  IF NOT EXISTS (

    SELECT 1 FROM pg_policies

    WHERE schemaname = 'public'

      AND tablename = 'user_roles'

      AND policyname = 'Users can view their own roles'

  ) THEN

    CREATE POLICY "Users can view their own roles"

    ON public.user_roles FOR SELECT TO authenticated

    USING (auth.uid() = user_id);

  END IF;

END $$;



-- SECURITY DEFINER: used by the site (checkIsAdmin) so RLS cannot hide admin status

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)

RETURNS boolean

LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public

AS $$

  SELECT EXISTS (

    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role

  )

$$;



REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;



-- ========== 1) Confirm the user exists in auth.users ==========

-- Expect 1 row. If 0 rows: sign up first at /auth, then re-run.

SELECT id, email, created_at, email_confirmed_at, last_sign_in_at

FROM auth.users

WHERE lower(email) = lower('trivarn440@gmail.com');



-- ========== 2) Insert admin role ==========

INSERT INTO public.user_roles (user_id, role)

SELECT id, 'admin'::public.app_role

FROM auth.users

WHERE lower(email) = lower('trivarn440@gmail.com')

ON CONFLICT DO NOTHING;



-- ========== 3) Verify admin grant ==========

-- Expect 1 row. Password is irrelevant here — only this role row matters.

SELECT u.email, r.role, u.email_confirmed_at, r.created_at AS role_granted_at

FROM public.user_roles r

JOIN auth.users u ON u.id = r.user_id

WHERE lower(u.email) = lower('trivarn440@gmail.com')

  AND r.role = 'admin';



-- Optional: same check via has_role (what the website uses)

SELECT u.email, public.has_role(u.id, 'admin'::public.app_role) AS is_admin

FROM auth.users u

WHERE lower(u.email) = lower('trivarn440@gmail.com');



-- All current admins (optional sanity check):

SELECT u.email, u.created_at, u.email_confirmed_at

FROM public.user_roles r

JOIN auth.users u ON u.id = r.user_id

WHERE r.role = 'admin'

ORDER BY u.email;


