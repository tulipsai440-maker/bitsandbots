-- Optional coach contact email (CC on broadcasts, join form, consent reminders)
ALTER TABLE public.coaches
  ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.coaches.email IS 'Optional — CC on parent emails when set';
