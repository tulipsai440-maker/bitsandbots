-- Grant demo admin to a recipient who signed up at /auth on their demo site.
--
-- Example demo: Bots4Life → https://bots4life-demo.fllbots.com/auth
-- Tenant id (reference only): cc79c490-7c54-496d-8b5a-2c8a230d9104
--
-- PASSWORD DOES NOT MATTER for admin access.
-- Admin requires: public.user_roles.role = 'admin' for that auth.users.id
--
-- Steps:
--   1. Recipient creates account at their demo URL + /auth and confirms email.
--   2. Replace the email below, then Run in Supabase SQL Editor:
--      https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new
--   3. Recipient signs in and opens /admin (or refreshes if already signed in).
--
-- Faster from your machine (uses service role, no SQL paste):
--   npm run grant:demo-admin -- --email recipient@example.com

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('REPLACE-WITH-THEIR-EMAIL@example.com')
ON CONFLICT DO NOTHING;

-- Verify:
SELECT u.email, u.email_confirmed_at, r.role
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
WHERE r.role = 'admin'
ORDER BY u.email;
