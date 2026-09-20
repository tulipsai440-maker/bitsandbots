-- Per-tenant toggle for the Zoom call meeting row, shown in the footer "When we meet"
-- list, the mobile visit bar, the About meetings section, the Join sidebar, and the
-- Calendar legend and schedule line.
--
-- Nothing is deleted: zoom_title / zoom_summary / zoom_place / zoom_url stay on the row
-- and remain editable in Admin, so a team that starts holding Zoom calls can flip this
-- back on without re-entering anything.
--
-- Safe to run in the same SQL Editor execution as patch-assignments-nav-visibility.sql
-- and patch-core-values-nav-visibility.sql.

-- 1) Column defaults to true so Bits & Bots production keeps its Wednesday Zoom call
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS show_zoom_meeting boolean NOT NULL DEFAULT true;

-- 2) Hide Zoom for the Bots4Life tenant only, and drop Zoom from its meeting copy
UPDATE public.site_settings
SET show_zoom_meeting = false,
    meetings_blurb = 'Team practice Saturdays 10:00 AM–12:00 PM in Naples.',
    meeting_summary = 'Saturdays 10–12',
    cta_body = 'Team practice Saturdays 10:00 AM–12:00 PM in Naples. Watch a robot run, meet the team, or just say hello.',
    events_hero_description = 'Team practice on Saturdays.',
    calendar_hero_description = 'Practices and team events.'
WHERE tenant_id = 'cc79c490-7c54-496d-8b5a-2c8a230d9104';

-- To show it again for Bots4Life:
--   UPDATE public.site_settings SET show_zoom_meeting = true
--   WHERE tenant_id = 'cc79c490-7c54-496d-8b5a-2c8a230d9104';

NOTIFY pgrst, 'reload schema';
