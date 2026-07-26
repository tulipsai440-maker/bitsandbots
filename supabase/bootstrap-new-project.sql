-- Troop 2001 — run once on a NEW Supabase project (xohaeezxzbeyzpjbngkj)
-- Dashboard: https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new
-- After this: sign up at /auth, then run grant-admin-tulipsai440.sql

-- ========== Migration 1: roles + events ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  type text NOT NULL DEFAULT 'Meeting',
  band_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are publicly readable"
ON public.events FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER events_set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.events (title, description, location, starts_at, type) VALUES
  ('Weekly Troop Meeting', 'Weekly meeting — uniform recommended.', 'North Collier Fire Station #45, 1885 Veterans Park Dr, Naples, FL 34109', (now() + interval '3 days')::date + time '19:00', 'Meeting'),
  ('Summer Court of Honor', 'Rank advancement and merit badge recognition ceremony.', 'North Collier Fire Station #45', (now() + interval '10 days')::date + time '19:00', 'Ceremony'),
  ('Big Cypress Weekend Campout', 'Weekend campout in the Big Cypress Preserve.', 'Big Cypress National Preserve', (now() + interval '18 days')::date + time '17:00', 'Campout'),
  ('Merit Badge University Signup Deadline', 'Deadline to register for Merit Badge University.', 'Online', (now() + interval '25 days')::date + time '23:59', 'Deadline');

-- ========== Migration 2: has_role permissions ==========
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- ========== Migration 3: eagle scouts, scoutmasters, announcements ==========
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
GRANT SELECT ON public.eagle_scouts TO anon, authenticated;
GRANT INSERT ON public.eagle_scouts TO anon, authenticated;
GRANT ALL ON public.eagle_scouts TO service_role;
ALTER TABLE public.eagle_scouts ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER eagle_scouts_set_updated_at
BEFORE UPDATE ON public.eagle_scouts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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
GRANT SELECT ON public.scoutmasters TO anon, authenticated;
GRANT INSERT ON public.scoutmasters TO anon, authenticated;
GRANT ALL ON public.scoutmasters TO service_role;
ALTER TABLE public.scoutmasters ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER scoutmasters_set_updated_at
BEFORE UPDATE ON public.scoutmasters
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements are publicly readable"
ON public.announcements FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage announcements"
ON public.announcements FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER announcements_set_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.eagle_scouts (year, name, project, status) VALUES
  ('2024', 'Ethan M.', 'Built native-plant nature trail markers at a local park.', 'approved'),
  ('2024', 'Noah R.', 'Constructed benches and shade for a community garden.', 'approved');

INSERT INTO public.scoutmasters (name, years, bio, status) VALUES
  ('Michael Anderson', '2020–Present', 'Experienced volunteer leader in the Naples scouting community.', 'approved');

INSERT INTO public.announcements (title, body) VALUES
  ('Welcome to Troop 2001 Naples', 'We meet Wednesdays at 7:00 PM at North Collier Fire Station #45. New scouts and families are always welcome!');
