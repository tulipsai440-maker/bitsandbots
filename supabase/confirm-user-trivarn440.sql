-- Confirm email + grant admin for trivarn440@gmail.com (local/dev helper)
-- Project: njhiqsbykiggxqkjrxse
-- Dashboard SQL Editor:
--   https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new
--
-- Use when sign-in fails because "Confirm email" is required, or the
-- user exists but email_confirmed_at is null.
-- Does NOT change the password.
--
-- If SELECT returns 0 rows → sign up at http://localhost:8080/auth first.
-- If user_roles / app_role missing → run bootstrap-new-project.sql
--   (or grant-admin-trivarn440.sql which includes a minimal roles bootstrap).

-- Remove broken duplicate signups (empty identities) for the same email
DELETE FROM auth.users
WHERE lower(email) = lower('trivarn440@gmail.com')
  AND id NOT IN (
    SELECT user_id FROM auth.identities WHERE provider = 'email'
  );

-- Confirm the account email (keeps existing password)
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE lower(email) = lower('trivarn440@gmail.com')
  AND id IN (SELECT user_id FROM auth.identities WHERE provider = 'email');

-- Grant admin (same as grant-admin-trivarn440.sql step 2)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('trivarn440@gmail.com')
ON CONFLICT DO NOTHING;

-- Verify
SELECT u.id, u.email, u.email_confirmed_at, r.role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'admin'
WHERE lower(u.email) = lower('trivarn440@gmail.com');
