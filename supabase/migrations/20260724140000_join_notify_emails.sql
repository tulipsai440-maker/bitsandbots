CREATE TABLE public.join_notify_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  label text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT join_notify_emails_email_unique UNIQUE (email),
  CONSTRAINT join_notify_emails_email_format CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

GRANT SELECT ON public.join_notify_emails TO anon, authenticated;
GRANT ALL ON public.join_notify_emails TO service_role;
ALTER TABLE public.join_notify_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active join notify emails are public"
ON public.join_notify_emails FOR SELECT TO anon, authenticated
USING (active = true);

CREATE POLICY "Admins manage join notify emails"
ON public.join_notify_emails FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER join_notify_emails_set_updated_at
BEFORE UPDATE ON public.join_notify_emails
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.join_notify_emails (email, label, sort_order) VALUES
  ('suresh440@gmail.com', 'Troop leader', 1);
