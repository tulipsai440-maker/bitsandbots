-- Bits & Bots — diagnose + grant admin
-- Project SQL Editor: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new
--
-- If "trivarn440" returns 0 rows, the account is NOT in THIS project.
-- You are probably signed in with a different email — check STEP A below.

-- ========== A) List EVERY auth user in this project ==========
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Look at the emails above. Use the EXACT email you sign in with on the website.

-- ========== B) Ensure roles table exists ==========
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

-- ========== C) Grant admin to EVERY current auth user ==========
-- (Safe for a new empty Bits & Bots project with one account.)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
ON CONFLICT DO NOTHING;

-- ========== D) Show who is admin now ==========
SELECT u.email, r.role, u.email_confirmed_at, r.created_at AS role_granted_at
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
WHERE r.role = 'admin'
ORDER BY u.email;
