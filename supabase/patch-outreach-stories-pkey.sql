-- Fix outreach_stories primary key for multi-tenant (one row per tenant + story id).
-- Run after setup-multi-tenant.sql if site content save fails with outreach_stories_pkey.
--
-- Before: PRIMARY KEY (id) — demo tenants collide with production story ids.
-- After:  PRIMARY KEY (tenant_id, id) — each tenant owns its own story ids.

ALTER TABLE public.outreach_stories
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.outreach_stories
  DROP CONSTRAINT IF EXISTS outreach_stories_pkey;

ALTER TABLE public.outreach_stories
  ADD PRIMARY KEY (tenant_id, id);

-- Keep explicit unique index in sync (optional if PK already covers it)
DROP INDEX IF EXISTS outreach_stories_tenant_id_key;

NOTIFY pgrst, 'reload schema';
