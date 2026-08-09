-- Fix: gen_salt/crypt not found (pgcrypto lives in extensions on Supabase)
-- Paste into SQL Editor and Run, then try setting a PIN again.
-- https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.set_member_pin(
  p_member_id uuid,
  p_pin text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token uuid;
BEGIN
  PERFORM public._assert_valid_pin(p_pin);

  IF NOT EXISTS (SELECT 1 FROM public.team_members WHERE id = p_member_id) THEN
    RAISE EXCEPTION 'Teammate not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.member_pins WHERE team_member_id = p_member_id) THEN
    RAISE EXCEPTION 'PIN already set — ask a coach to reset it if you forgot';
  END IF;

  INSERT INTO public.member_pins (team_member_id, pin_hash)
  VALUES (p_member_id, crypt(p_pin, gen_salt('bf'::text)));

  DELETE FROM public.member_sessions WHERE team_member_id = p_member_id;

  INSERT INTO public.member_sessions (team_member_id, expires_at)
  VALUES (p_member_id, now() + interval '14 days')
  RETURNING token INTO v_token;

  DELETE FROM public.member_pin_attempts WHERE team_member_id = p_member_id;

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.login_member_pin(
  p_member_id uuid,
  p_pin text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_token uuid;
  v_fails int;
  v_locked timestamptz;
BEGIN
  PERFORM public._assert_valid_pin(p_pin);

  SELECT fail_count, locked_until
  INTO v_fails, v_locked
  FROM public.member_pin_attempts
  WHERE team_member_id = p_member_id;

  IF v_locked IS NOT NULL AND v_locked > now() THEN
    RAISE EXCEPTION 'Too many attempts — try again later';
  END IF;

  SELECT pin_hash INTO v_hash
  FROM public.member_pins
  WHERE team_member_id = p_member_id;

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'Set a PIN first';
  END IF;

  IF v_hash <> crypt(p_pin, v_hash) THEN
    INSERT INTO public.member_pin_attempts (team_member_id, fail_count, locked_until, updated_at)
    VALUES (
      p_member_id,
      1,
      CASE WHEN 1 >= 8 THEN now() + interval '15 minutes' ELSE NULL END,
      now()
    )
    ON CONFLICT (team_member_id) DO UPDATE SET
      fail_count = CASE
        WHEN public.member_pin_attempts.locked_until IS NOT NULL
          AND public.member_pin_attempts.locked_until <= now()
        THEN 1
        ELSE public.member_pin_attempts.fail_count + 1
      END,
      locked_until = CASE
        WHEN (
          CASE
            WHEN public.member_pin_attempts.locked_until IS NOT NULL
              AND public.member_pin_attempts.locked_until <= now()
            THEN 1
            ELSE public.member_pin_attempts.fail_count + 1
          END
        ) >= 8 THEN now() + interval '15 minutes'
        ELSE NULL
      END,
      updated_at = now();

    RAISE EXCEPTION 'Incorrect PIN';
  END IF;

  DELETE FROM public.member_pin_attempts WHERE team_member_id = p_member_id;
  DELETE FROM public.member_sessions WHERE team_member_id = p_member_id;

  INSERT INTO public.member_sessions (team_member_id, expires_at)
  VALUES (p_member_id, now() + interval '14 days')
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

NOTIFY pgrst, 'reload schema';
