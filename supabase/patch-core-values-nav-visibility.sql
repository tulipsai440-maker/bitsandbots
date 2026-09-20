-- Per-tenant toggle for the Core Values page and every link to it
-- (header nav, footer "Explore", visit bar, homepage pillar link).
--
-- Core Values is a judged FIRST category, so nothing is deleted: the /core-values route,
-- page component, core_values rows, and admin editor all stay. Tenants with the flag off
-- render the standard not-found page instead.
--
-- Safe to run in the same SQL Editor execution as patch-assignments-nav-visibility.sql.

-- 1) Column defaults to true so Bits & Bots production keeps Core Values
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS show_core_values_nav boolean NOT NULL DEFAULT true;

-- 2) Hide Core Values for the Bots4Life demo tenant only
UPDATE public.site_settings
SET show_core_values_nav = false
WHERE tenant_id = 'cc79c490-7c54-496d-8b5a-2c8a230d9104';

-- To show it again for Bots4Life:
--   UPDATE public.site_settings SET show_core_values_nav = true
--   WHERE tenant_id = 'cc79c490-7c54-496d-8b5a-2c8a230d9104';

NOTIFY pgrst, 'reload schema';
