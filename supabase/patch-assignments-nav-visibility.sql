-- Per-tenant toggle for the Assignments nav / footer / visit-bar links.
-- The /assignments route, page, and tables are untouched — this only hides the links.
--
-- Run once in Supabase SQL Editor.

-- 1) Column defaults to true so Bits & Bots production keeps showing Assignments
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS show_assignments_nav boolean NOT NULL DEFAULT true;

-- 2) Hide the Assignments tab for the Bots4Life demo tenant only
UPDATE public.site_settings
SET show_assignments_nav = false
WHERE tenant_id = 'cc79c490-7c54-496d-8b5a-2c8a230d9104';

-- To show it again for Bots4Life:
--   UPDATE public.site_settings SET show_assignments_nav = true
--   WHERE tenant_id = 'cc79c490-7c54-496d-8b5a-2c8a230d9104';

NOTIFY pgrst, 'reload schema';
