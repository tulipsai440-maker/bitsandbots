-- Automated admin email dedup tables (run once in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS public.assignment_due_soon_reminders (
  assignment_task_id uuid NOT NULL REFERENCES public.assignment_tasks(id) ON DELETE CASCADE,
  parent_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assignment_task_id, parent_email)
);

CREATE INDEX IF NOT EXISTS assignment_due_soon_reminders_task_idx
  ON public.assignment_due_soon_reminders (assignment_task_id);

GRANT ALL ON public.assignment_due_soon_reminders TO service_role;
ALTER TABLE public.assignment_due_soon_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read due soon reminders" ON public.assignment_due_soon_reminders;
CREATE POLICY "Admins read due soon reminders"
ON public.assignment_due_soon_reminders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.calendar_reminder_log (
  calendar_id uuid NOT NULL REFERENCES public.calendar(id) ON DELETE CASCADE,
  reminder_date date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (calendar_id, reminder_date)
);

GRANT ALL ON public.calendar_reminder_log TO service_role;
ALTER TABLE public.calendar_reminder_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read calendar reminders" ON public.calendar_reminder_log;
CREATE POLICY "Admins read calendar reminders"
ON public.calendar_reminder_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.coach_digest_log (
  week_start date PRIMARY KEY,
  sent_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.coach_digest_log TO service_role;
ALTER TABLE public.coach_digest_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read coach digest log" ON public.coach_digest_log;
CREATE POLICY "Admins read coach digest log"
ON public.coach_digest_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
