-- Shared demo coach admin for Bots4Life handover.
-- Prefer: npm run provision:demo-admin -- --slug bots4life
-- (creates auth user + confirms email + grants admin in one step)
--
-- Manual fallback if script unavailable:
--   1. Supabase → Authentication → Users → Add user
--      Email: bots4life@demo.fllbots.com
--      Password: First@2026
--      Auto-confirm: ON
--   2. Run grant block below.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('bots4life@demo.fllbots.com')
ON CONFLICT DO NOTHING;

SELECT u.email, u.email_confirmed_at, r.role
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
WHERE lower(u.email) = lower('bots4life@demo.fllbots.com');
