-- Multi-tenant foundation: one Supabase project, 100+ teams.
-- Run AFTER all setup-*.sql on your Supabase project.
-- Backfills existing Bits & Bots data as tenant slug "bitsandbots".

-- ========== Registry ==========

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'demo' CHECK (status IN ('demo', 'live')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_domains_tenant_id_idx ON public.tenant_domains (tenant_id);

CREATE TABLE IF NOT EXISTS public.tenant_members (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

GRANT SELECT ON public.tenants TO anon, authenticated;
GRANT SELECT ON public.tenant_domains TO anon, authenticated;
GRANT SELECT ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.tenant_domains TO service_role;
GRANT ALL ON public.tenant_members TO service_role;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants are publicly readable" ON public.tenants;
CREATE POLICY "Tenants are publicly readable"
ON public.tenants FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Tenant domains are publicly readable" ON public.tenant_domains;
CREATE POLICY "Tenant domains are publicly readable"
ON public.tenant_domains FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Users read own tenant memberships" ON public.tenant_members;
CREATE POLICY "Users read own tenant memberships"
ON public.tenant_members FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages tenant members" ON public.tenant_members;
CREATE POLICY "Service role manages tenant members"
ON public.tenant_members FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Fixed UUID for production Bits & Bots (predictable backfill).
INSERT INTO public.tenants (id, slug, display_name, status)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'bitsandbots',
  'Bits & Bots',
  'live'
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  status = EXCLUDED.status;

INSERT INTO public.tenant_domains (tenant_id, hostname, is_primary)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'fllbots.com', true),
  ('a1111111-1111-1111-1111-111111111111', 'www.fllbots.com', false),
  ('a1111111-1111-1111-1111-111111111111', 'localhost', false)
ON CONFLICT (hostname) DO NOTHING;

-- ========== Helpers ==========

CREATE OR REPLACE FUNCTION public.has_tenant_role(
  p_tenant_id uuid,
  p_user_id uuid,
  p_role text DEFAULT 'admin'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
      AND tm.user_id = p_user_id
      AND tm.role = p_role
  )
  OR public.has_role(p_user_id, 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.resolve_tenant(p_hostname text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'tenant_id', t.id,
    'slug', t.slug,
    'display_name', t.display_name,
    'status', t.status
  )
  FROM public.tenant_domains td
  JOIN public.tenants t ON t.id = td.tenant_id
  WHERE td.hostname = lower(trim(split_part(coalesce(p_hostname, ''), ':', 1)))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_tenant(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.resolve_tenant_by_slug(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'tenant_id', t.id,
    'slug', t.slug,
    'display_name', t.display_name,
    'status', t.status
  )
  FROM public.tenants t
  WHERE t.slug = lower(trim(p_slug))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_tenant_by_slug(text) TO anon, authenticated, service_role;

-- ========== Add tenant_id to team-scoped tables ==========

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'site_settings',
    'outreach_stories',
    'team_members',
    'coaches',
    'sponsors',
    'calendar',
    'site_images',
    'gallery_photos',
    'assignments',
    'assignment_tasks',
    'member_pins',
    'member_sessions',
    'member_pin_attempts',
    'participant_details',
    'parent_contacts',
    'parent_media_consents',
    'join_notify_emails',
    'broadcast_settings',
    'announcements',
    'assignment_overdue_reminders',
    'assignment_due_soon_reminders',
    'calendar_reminder_log',
    'coach_digest_log'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id)',
        tbl
      );
      EXECUTE format(
        'UPDATE public.%I SET tenant_id = ''a1111111-1111-1111-1111-111111111111'' WHERE tenant_id IS NULL',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- site_settings: allow one row per tenant (drop singleton id=1 constraint)
ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_id_check;
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_tenant_id_key ON public.site_settings (tenant_id);

-- broadcast_settings: one row per tenant
ALTER TABLE public.broadcast_settings DROP CONSTRAINT IF EXISTS broadcast_settings_id_check;
CREATE UNIQUE INDEX IF NOT EXISTS broadcast_settings_tenant_id_key ON public.broadcast_settings (tenant_id);

-- outreach_stories: scope by tenant
CREATE UNIQUE INDEX IF NOT EXISTS outreach_stories_tenant_id_key ON public.outreach_stories (tenant_id, id);

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS team_members_tenant_id_idx ON public.team_members (tenant_id);
CREATE INDEX IF NOT EXISTS coaches_tenant_id_idx ON public.coaches (tenant_id);
CREATE INDEX IF NOT EXISTS sponsors_tenant_id_idx ON public.sponsors (tenant_id);
CREATE INDEX IF NOT EXISTS calendar_tenant_id_idx ON public.calendar (tenant_id);
CREATE INDEX IF NOT EXISTS gallery_photos_tenant_id_idx ON public.gallery_photos (tenant_id);

-- ========== Provision helper (called from scripts/provision-team.mjs) ==========

CREATE OR REPLACE FUNCTION public.provision_tenant(
  p_slug text,
  p_display_name text,
  p_play_domain text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_hostname text;
BEGIN
  IF length(trim(p_slug)) < 2 THEN
    RAISE EXCEPTION 'slug too short';
  END IF;

  INSERT INTO public.tenants (slug, display_name, status)
  VALUES (lower(trim(p_slug)), trim(p_display_name), 'demo')
  ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name
  RETURNING id INTO v_tenant_id;

  v_hostname := coalesce(
    nullif(trim(p_play_domain), ''),
    lower(trim(p_slug)) || '.demo.com'
  );

  INSERT INTO public.tenant_domains (tenant_id, hostname, is_primary)
  VALUES (v_tenant_id, v_hostname, true)
  ON CONFLICT (hostname) DO UPDATE SET tenant_id = EXCLUDED.tenant_id;

  -- site_settings: clone defaults from bitsandbots if missing
  INSERT INTO public.site_settings (
    id, tenant_id, site_name, site_tagline, founded_year, site_url,
    practice_summary, practice_place, zoom_summary, zoom_place,
    meetings_blurb, meeting_summary, about_blurb, about_hero_description,
    join_hero_description, hero_subtext, season_eyebrow, season_story_title,
    season_story_body, season_story_link_label, what_we_do_title, what_we_do_subtitle,
    cta_title, cta_body, core_values_intro
  )
  SELECT
    (SELECT COALESCE(MAX(ss2.id), 0) + 1 FROM public.site_settings ss2),
    v_tenant_id,
    p_display_name,
    'FIRST LEGO League · Demo & play',
    '2025',
    'https://' || v_hostname,
    ss.practice_summary, ss.practice_place, ss.zoom_summary, ss.zoom_place,
    ss.meetings_blurb, ss.meeting_summary,
    'Demo team site — customize names, photos, and copy in Admin.',
    p_display_name || ' is a FIRST LEGO League team site.',
    ss.join_hero_description,
    'Explore the site and customize every page in Admin.',
    ss.season_eyebrow, ss.season_story_title, ss.season_story_body, ss.season_story_link_label,
    ss.what_we_do_title, ss.what_we_do_subtitle, ss.cta_title, ss.cta_body, ss.core_values_intro
  FROM public.site_settings ss
  WHERE ss.tenant_id = 'a1111111-1111-1111-1111-111111111111'
  LIMIT 1
  ON CONFLICT (tenant_id) DO UPDATE SET site_name = EXCLUDED.site_name;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'slug', lower(trim(p_slug)),
    'hostname', v_hostname,
    'url', 'https://' || v_hostname
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_tenant(text, text, text) TO service_role;

NOTIFY pgrst, 'reload schema';
