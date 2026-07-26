-- Remove broken duplicate signups (empty identities) for the same email
DELETE FROM auth.users
WHERE email = 'tulipsai440@gmail.com'
  AND id NOT IN (
    SELECT user_id FROM auth.identities WHERE provider = 'email'
  );

-- Ensure one good user: confirm email, set password, grant admin
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE auth.users
SET
  encrypted_password = crypt('Troop2001Admin!2025', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'tulipsai440@gmail.com'
  AND id IN (SELECT user_id FROM auth.identities WHERE provider = 'email');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'tulipsai440@gmail.com'
ON CONFLICT DO NOTHING;
