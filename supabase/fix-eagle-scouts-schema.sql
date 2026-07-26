-- Run ONLY if admin form errors mention missing columns (wrong bootstrap schema)
-- Safe to run: uses IF NOT EXISTS / conditional alters

-- eagle_scouts: match app columns (year text, submitted_by_email, admin_notes)
DO $$ BEGIN
  ALTER TABLE public.eagle_scouts ALTER COLUMN year TYPE text USING year::text;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.eagle_scouts ADD COLUMN IF NOT EXISTS submitted_by_email text;
ALTER TABLE public.eagle_scouts ADD COLUMN IF NOT EXISTS admin_notes text;

DO $$ BEGIN
  ALTER TABLE public.eagle_scouts ALTER COLUMN project SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- scoutmasters: app expects "years" not "title"
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS years text;
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS submitted_by_email text;
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS admin_notes text;

UPDATE public.scoutmasters SET years = COALESCE(years, title, '—') WHERE years IS NULL;

DO $$ BEGIN
  ALTER TABLE public.scoutmasters ALTER COLUMN years SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
