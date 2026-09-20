-- site_images: allow one override row per tenant per slot key
-- Fixes: duplicate key value violates unique constraint "site_images_pkey"
-- when saving hero (or any slot) after multi-tenant was added.
--
-- Run once in Supabase SQL Editor, then retry Admin → Site images upload.

-- 1) Ensure tenant_id column exists
ALTER TABLE public.site_images
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- 2) Backfill NULL tenant_id to Bits & Bots production tenant
UPDATE public.site_images
SET tenant_id = 'a1111111-1111-1111-1111-111111111111'
WHERE tenant_id IS NULL;

-- 3) Drop legacy single-column primary key on `key`
ALTER TABLE public.site_images DROP CONSTRAINT IF EXISTS site_images_pkey;

-- 4) tenant_id required going forward
ALTER TABLE public.site_images ALTER COLUMN tenant_id SET NOT NULL;

-- 5) One row per (tenant, key)
DROP INDEX IF EXISTS site_images_tenant_key_unique;
CREATE UNIQUE INDEX site_images_tenant_key_unique ON public.site_images (tenant_id, key);

NOTIFY pgrst, 'reload schema';
