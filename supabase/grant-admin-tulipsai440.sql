-- Run AFTER signing up at http://localhost:8080/auth with tulipsai440@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'tulipsai440@gmail.com'
ON CONFLICT DO NOTHING;
