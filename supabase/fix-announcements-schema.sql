-- Optional: add active + sort_order columns (app works without these using title/body/expires_at)
-- Run only if you want explicit columns instead of expires_at for visibility.
-- https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

UPDATE public.announcements
SET active = (expires_at IS NULL OR expires_at > now())
WHERE active IS DISTINCT FROM (expires_at IS NULL OR expires_at > now());
