-- Sponsors table (logo + name + description)
-- Run: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Coming soon',
  description text,
  logo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sponsors_sort_idx ON public.sponsors (sort_order, name);

GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sponsors are publicly readable" ON public.sponsors;
CREATE POLICY "Sponsors are publicly readable"
ON public.sponsors FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage sponsors" ON public.sponsors;
CREATE POLICY "Authenticated users can manage sponsors"
ON public.sponsors FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Seed 3 placeholders if empty
INSERT INTO public.sponsors (name, description, logo_url, sort_order)
SELECT v.name, NULL, NULL, v.sort_order
FROM (VALUES
  ('Coming soon', 1),
  ('Coming soon', 2),
  ('Coming soon', 3)
) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.sponsors LIMIT 1);
