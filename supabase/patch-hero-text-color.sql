-- Hero overlay text color (admin can pick for contrast on photo backgrounds)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_text_color text NOT NULL DEFAULT '#faf7f2';
