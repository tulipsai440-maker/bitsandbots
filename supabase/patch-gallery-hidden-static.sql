-- Track admin-hidden bundled gallery photos per tenant (demo sample photos, etc.)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS gallery_hidden_static_srcs jsonb NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
