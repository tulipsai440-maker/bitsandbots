-- Grant admin access to someone who already signed up at /auth
-- =============================================================
-- Signing up does NOT make someone an admin. This adds the admin role.
--
-- How to use:
--   1. Have the person create an account at https://troop2001naples.org/auth
--      and confirm their email.
--   2. Open the Supabase SQL Editor:
--      https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new
--   3. Replace the email below with theirs, then click Run.
--   4. Have them refresh the admin page — they now have full access.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('REPLACE-WITH-THEIR-EMAIL@example.com')
ON CONFLICT DO NOTHING;

-- Check who currently has admin access:
SELECT u.email, u.created_at, u.email_confirmed_at
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
WHERE r.role = 'admin'
ORDER BY u.email;

-- To REMOVE someone's admin access (keep at least one admin!):
-- DELETE FROM public.user_roles
-- WHERE role = 'admin'
--   AND user_id = (SELECT id FROM auth.users WHERE lower(email) = lower('their-email@example.com'));
