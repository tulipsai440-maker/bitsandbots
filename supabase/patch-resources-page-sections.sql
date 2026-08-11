-- Resources page section headings (inline admin edit on /resources)
-- Run once in Supabase SQL Editor.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS resources_page_sections jsonb NOT NULL DEFAULT '{
    "documentsTitle": "Season documents",
    "documentsDescription": "Official PDFs the team uses every week — notebook, rulebook, missions, rubric, and score sheet.",
    "programTitle": "FIRST program links",
    "programDescription": "Official sites, guides, and materials from FIRST and FIRST LEGO League.",
    "teamTitle": "On this site",
    "teamDescription": "Team calendar, gallery, and other pages for families.",
    "playlistButtonLabel": "Full season playlist",
    "materialsButtonLabel": "All LEGO Education materials"
  }'::jsonb;

NOTIFY pgrst, 'reload schema';
