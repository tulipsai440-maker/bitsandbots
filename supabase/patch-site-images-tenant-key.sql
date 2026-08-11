-- site_images: one override row per tenant per slot key (not global PK on key alone)
-- Run after setup-multi-tenant.sql

ALTER TABLE public.site_images DROP CONSTRAINT IF EXISTS site_images_pkey;
ALTER TABLE public.site_images ALTER COLUMN tenant_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS site_images_tenant_key_unique ON public.site_images (tenant_id, key);

NOTIFY pgrst, 'reload schema';
