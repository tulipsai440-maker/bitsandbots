-- Bits & Bots calendar — source of truth for the public /calendar page
-- Managed from Admin → Calendar. Run once:
-- https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

CREATE TABLE IF NOT EXISTS public.calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date date NOT NULL,
  title text NOT NULL,
  agenda text,
  location text,
  start_time time,
  end_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_event_date_idx ON public.calendar (event_date);

GRANT SELECT ON public.calendar TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar TO authenticated;
GRANT ALL ON public.calendar TO service_role;

ALTER TABLE public.calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Calendar is publicly readable" ON public.calendar;
DROP POLICY IF EXISTS "Authenticated users can manage calendar" ON public.calendar;
DROP POLICY IF EXISTS "Anon can read calendar" ON public.calendar;
DROP POLICY IF EXISTS "Auth can insert calendar" ON public.calendar;
DROP POLICY IF EXISTS "Auth can update calendar" ON public.calendar;
DROP POLICY IF EXISTS "Auth can delete calendar" ON public.calendar;

CREATE POLICY "Anon can read calendar"
ON public.calendar FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Auth can insert calendar"
ON public.calendar FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Auth can update calendar"
ON public.calendar FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Auth can delete calendar"
ON public.calendar FOR DELETE TO authenticated
USING (true);

-- Seed weekly meetings (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.calendar LIMIT 1) THEN
    INSERT INTO public.calendar (event_date, title, agenda, location, start_time, end_time)
    SELECT
      d::date,
      'Team practice',
      'Weekly in-person team practice — robot building, coding, and challenge prep.',
      'Coaches Home',
      time '15:00',
      time '17:00'
    FROM generate_series(
      (CURRENT_DATE - interval '60 days')::date,
      DATE '2027-02-28',
      interval '1 day'
    ) AS g(d)
    WHERE EXTRACT(DOW FROM d) = 0;

    INSERT INTO public.calendar (event_date, title, agenda, location, start_time, end_time)
    SELECT
      d::date,
      'Zoom call',
      'Weekly online team check-in on Zoom. Link shared with families when available.',
      'Online · Zoom',
      time '18:00',
      time '18:30'
    FROM generate_series(
      (CURRENT_DATE - interval '60 days')::date,
      DATE '2027-02-28',
      interval '1 day'
    ) AS g(d)
    WHERE EXTRACT(DOW FROM d) = 3;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
