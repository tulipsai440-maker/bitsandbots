-- Add page hero descriptions for inline edit on Coaches, Sponsors, Outreach pages
-- Run in Supabase SQL editor if setup-site-settings.sql was already applied

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS coaches_hero_description text,
  ADD COLUMN IF NOT EXISTS sponsors_hero_description text,
  ADD COLUMN IF NOT EXISTS outreach_hero_description text;

UPDATE public.site_settings SET
  coaches_hero_description = COALESCE(coaches_hero_description, 'The coaches who guide Bits & Bots through builds, coding, Core Values, and competition season.'),
  sponsors_hero_description = COALESCE(sponsors_hero_description, 'Community partners help Bits & Bots build, compete, and share FIRST LEGO League with others.'),
  outreach_hero_description = COALESCE(outreach_hero_description, 'Bits & Bots shares FIRST LEGO League beyond our own meetings—mentoring new teams and hosting workshops at community events.')
WHERE id = 1;

NOTIFY pgrst, 'reload schema';
