-- Add headshot URL for scoutmasters (run once in SQL Editor)
ALTER TABLE public.scoutmasters ADD COLUMN IF NOT EXISTS photo_url text;
