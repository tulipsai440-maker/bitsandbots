-- Run both pending migrations in Supabase SQL Editor (in order, or all at once).
-- Project: https://supabase.com/dashboard/project/qyrlqvmamturvjvjqjfy/sql/new

CREATE TYPE public.content_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.eagle_scouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text NOT NULL,
  name text NOT NULL,
  project text NOT NULL,
  status public.content_status NOT NULL DEFAULT 'pending',
  submitted_by_email text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.scoutmasters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  years text NOT NULL,
  bio text,
  status public.content_status NOT NULL DEFAULT 'pending',
  submitted_by_email text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.eagle_scouts TO anon, authenticated;
GRANT SELECT ON public.scoutmasters TO anon, authenticated;
GRANT INSERT ON public.eagle_scouts TO anon, authenticated;
GRANT INSERT ON public.scoutmasters TO anon, authenticated;
GRANT ALL ON public.eagle_scouts TO service_role;
GRANT ALL ON public.scoutmasters TO service_role;

ALTER TABLE public.eagle_scouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoutmasters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved eagle scouts are public"
ON public.eagle_scouts FOR SELECT TO anon, authenticated
USING (status = 'approved');

CREATE POLICY "Anyone can suggest eagle scout entries"
ON public.eagle_scouts FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pending');

CREATE POLICY "Admins manage eagle scouts"
ON public.eagle_scouts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved scoutmasters are public"
ON public.scoutmasters FOR SELECT TO anon, authenticated
USING (status = 'approved');

CREATE POLICY "Anyone can suggest scoutmaster entries"
ON public.scoutmasters FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pending');

CREATE POLICY "Admins manage scoutmasters"
ON public.scoutmasters FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER eagle_scouts_set_updated_at
BEFORE UPDATE ON public.eagle_scouts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER scoutmasters_set_updated_at
BEFORE UPDATE ON public.scoutmasters
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.eagle_scouts (year, name, project, status) VALUES
  ('2024', 'Ethan M.', 'Built native-plant nature trail markers at a local park.', 'approved'),
  ('2024', 'Noah R.', 'Constructed benches and shade for a community garden.', 'approved'),
  ('2023', 'Liam S.', 'Renovated an outdoor classroom at an elementary school.', 'approved'),
  ('2023', 'Owen P.', 'Organized food drive and pantry shelving project.', 'approved'),
  ('2022', 'Caleb T.', 'Installed bat houses to support local ecosystem.', 'approved'),
  ('2022', 'Mason K.', 'Refurbished veterans memorial landscaping.', 'approved'),
  ('2021', 'Jacob H.', 'Built little free libraries across four neighborhoods.', 'approved'),
  ('2020', 'Aiden B.', 'Assembled pandemic-response care packages for seniors.', 'approved');

INSERT INTO public.scoutmasters (name, years, bio, status) VALUES
  ('Michael Anderson', '2020–Present', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved'),
  ('James Rodriguez', '2018–2020', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved'),
  ('David Thompson', '2015–2018', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved'),
  ('Robert Martinez', '2012–2015', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved'),
  ('William Chen', '2010–2012', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved'),
  ('Christopher Lee', '2008–2010', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved'),
  ('Daniel O''Brien', '2006–2008', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved'),
  ('Matthew Patel', '2004–2006', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved'),
  ('Andrew Sullivan', '2002–2004', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved'),
  ('John Whitaker', '2000–2002', 'Placeholder biography. An experienced volunteer leader dedicated to scouting values, outdoor skills, and youth development in the Naples community.', 'approved');

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

-- ========== Join notification emails ==========
CREATE TABLE IF NOT EXISTS public.join_notify_emails (
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

DROP POLICY IF EXISTS "Active join notify emails are public" ON public.join_notify_emails;
CREATE POLICY "Active join notify emails are public"
ON public.join_notify_emails FOR SELECT TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Admins manage join notify emails" ON public.join_notify_emails;
CREATE POLICY "Admins manage join notify emails"
ON public.join_notify_emails FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS join_notify_emails_set_updated_at ON public.join_notify_emails;
CREATE TRIGGER join_notify_emails_set_updated_at
BEFORE UPDATE ON public.join_notify_emails
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.join_notify_emails (email, label, sort_order)
VALUES ('suresh440@gmail.com', 'Troop leader', 1)
ON CONFLICT (email) DO NOTHING;
