-- Platform demo hostnames: {slug}.demo.com (configurable via apex; default demo.com)
-- Run after setup-multi-tenant.sql

CREATE OR REPLACE FUNCTION public.provision_tenant(
  p_slug text,
  p_display_name text,
  p_demo_domain text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_hostname text;
  v_slug text;
  v_default_demo text := 'demo.com';
BEGIN
  IF length(trim(p_slug)) < 2 THEN
    RAISE EXCEPTION 'slug too short';
  END IF;

  v_slug := lower(trim(p_slug));
  v_hostname := coalesce(nullif(lower(trim(p_demo_domain)), ''), v_slug || '.demo.com');

  IF v_hostname LIKE '%.fllbots.com' AND v_hostname NOT LIKE '%.demo.fllbots.com' AND v_hostname NOT IN ('fllbots.com', 'www.fllbots.com') THEN
    NULL; -- allow {slug}.fllbots.com legacy
  ELSIF v_hostname NOT LIKE '%.demo.com'
    AND v_hostname NOT LIKE '%.demo.fllbots.com'
    AND v_hostname NOT LIKE '%.play.fllbots.com' THEN
    RAISE EXCEPTION 'Demo host must be {slug}.demo.com (or legacy *.demo.fllbots.com), got %', v_hostname;
  END IF;

  INSERT INTO public.tenants (slug, display_name, status)
  VALUES (v_slug, trim(p_display_name), 'demo')
  ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.tenant_domains (tenant_id, hostname, is_primary)
  VALUES (v_tenant_id, v_hostname, true)
  ON CONFLICT (hostname) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, is_primary = true;

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
    'FIRST LEGO League · Demo site',
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
  ON CONFLICT (tenant_id) DO UPDATE SET
    site_name = EXCLUDED.site_name,
    site_url = EXCLUDED.site_url;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'slug', v_slug,
    'hostname', v_hostname,
    'url', 'https://' || v_hostname
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_tenant(text, text, text) TO service_role;

-- Migrate Bots4Life (run once if on legacy play/demo.fllbots host):
-- UPDATE public.tenant_domains SET hostname = 'bots4life.demo.com', is_primary = true
-- WHERE hostname IN ('bots4life.play.fllbots.com', 'bots4life.demo.fllbots.com');
-- UPDATE public.site_settings ss SET site_url = 'https://bots4life.demo.com'
-- FROM public.tenants t WHERE ss.tenant_id = t.id AND t.slug = 'bots4life';

NOTIFY pgrst, 'reload schema';
