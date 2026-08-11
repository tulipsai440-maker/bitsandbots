-- Team brand color (buttons, links, forest theme) — run after setup-site-settings.sql
-- https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS brand_color text NOT NULL DEFAULT '#1f3d1f';

UPDATE public.site_settings
SET brand_color = COALESCE(NULLIF(trim(brand_color), ''), '#1f3d1f')
WHERE id = 1;

NOTIFY pgrst, 'reload schema';
