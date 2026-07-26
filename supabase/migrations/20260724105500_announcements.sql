
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active announcements are public"
ON public.announcements FOR SELECT TO anon, authenticated
USING (active = true);

CREATE POLICY "Admins manage announcements"
ON public.announcements FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER announcements_set_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.announcements (body, sort_order) VALUES
  ('Registration is open for Fall camping season — see the Calendar for dates.', 1),
  ('Congratulations to our newest Eagle Scout — full ceremony recap in Events.', 2),
  ('Merit Badge University sign-ups close August 15th.', 3);
