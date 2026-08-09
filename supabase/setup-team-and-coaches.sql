-- Bits & Bots — Our Team + Coaches tables (separate)
-- Run in SQL Editor: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

-- ========== Our Team ==========
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  photo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_sort_idx ON public.team_members (sort_order, name);

GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members are publicly readable" ON public.team_members;
CREATE POLICY "Team members are publicly readable"
ON public.team_members FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage team members" ON public.team_members;
CREATE POLICY "Authenticated users can manage team members"
ON public.team_members FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Seed team (skip if name already exists)
INSERT INTO public.team_members (name, description, photo_url, sort_order)
SELECT v.name, v.description, NULL, v.sort_order
FROM (VALUES
  ('Trivarn Bheemanapalli (Joy)', 'Joy loves coding—debugging mission runs and making the robot''s programs sharper every week.', 1),
  ('Alexander Zabala (Alok)', 'Alex likes design—sketching mechanisms and shaping how the robot looks and works on the table.', 2),
  ('Tejasri Pandiri', NULL, 3),
  ('Vihas Koyyalmudi', 'Vihas loves exploring innovation—digging into the season theme and chasing bold Innovation Project ideas.', 4),
  ('Harshitha Naveenkumar', 'Harshitha loves working with the team—keeping everyone connected and moving forward together.', 5),
  ('Aarav Jalwankar', 'Aarav loves building apps—turning team ideas into tools the squad can actually use.', 6),
  ('Aarohi Jalwankar', 'Aarohi enjoys creativity—bringing fresh ideas to builds, presentations, and outreach.', 7)
) AS v(name, description, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members t WHERE lower(t.name) = lower(v.name)
);

-- ========== Coaches ==========
CREATE TABLE IF NOT EXISTS public.coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  photo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coaches_sort_idx ON public.coaches (sort_order, name);

GRANT SELECT ON public.coaches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaches TO authenticated;
GRANT ALL ON public.coaches TO service_role;

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches are publicly readable" ON public.coaches;
CREATE POLICY "Coaches are publicly readable"
ON public.coaches FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage coaches" ON public.coaches;
CREATE POLICY "Authenticated users can manage coaches"
ON public.coaches FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

INSERT INTO public.coaches (name, description, photo_url, sort_order)
SELECT v.name, NULL, NULL, v.sort_order
FROM (VALUES
  ('Jaime Zabala', 1),
  ('Suresh Bheemanapalli', 2)
) AS v(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.coaches c WHERE lower(c.name) = lower(v.name)
);
