-- Overdue assignment parent reminders (one email per parent the day after due date)
-- Run once: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

CREATE TABLE IF NOT EXISTS public.assignment_overdue_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_task_id uuid NOT NULL REFERENCES public.assignment_tasks(id) ON DELETE CASCADE,
  parent_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_task_id, parent_email)
);

CREATE INDEX IF NOT EXISTS assignment_overdue_reminders_task_idx
  ON public.assignment_overdue_reminders (assignment_task_id);

GRANT ALL ON public.assignment_overdue_reminders TO service_role;

ALTER TABLE public.assignment_overdue_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read overdue reminders" ON public.assignment_overdue_reminders;
CREATE POLICY "Admins read overdue reminders"
ON public.assignment_overdue_reminders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';
