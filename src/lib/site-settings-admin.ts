import { supabase } from "@/integrations/supabase/client";
import { normalizeAccentColor, normalizeBrandColor } from "@/lib/brand-colors";
import {
  DEFAULT_SITE_SETTINGS,
  siteSettingsErrorMessage,
  type OutreachStoryRow,
  type SiteSettings,
} from "@/lib/site-settings";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export { siteSettingsErrorMessage, isSiteSettingsSetupMissing } from "@/lib/site-settings";

export type SiteContentAdminData = {
  settings: SiteSettings;
  outreachStories: OutreachStoryRow[];
};

function settingsToRow(settings: SiteSettings, tenantId: string, rowId: number) {
  return {
    id: rowId,
    tenant_id: tenantId,
    site_name: settings.siteName,
    site_tagline: settings.siteTagline,
    brand_color: normalizeBrandColor(settings.brandColor),
    accent_color: normalizeAccentColor(settings.accentColor),
    founded_year: settings.foundedYear,
    site_url: settings.siteUrl,
    practice_title: settings.practiceTitle,
    practice_summary: settings.practiceSummary,
    practice_place: settings.practicePlace,
    zoom_title: settings.zoomTitle,
    zoom_summary: settings.zoomSummary,
    zoom_place: settings.zoomPlace,
    zoom_url: settings.zoomUrl,
    meetings_blurb: settings.meetingsBlurb,
    meeting_summary: settings.meetingSummary,
    about_blurb: settings.aboutBlurb,
    about_page_title: settings.aboutPageTitle,
    about_hero_description: settings.aboutHeroDescription,
    about_team_section_title: settings.aboutTeamSectionTitle,
    about_meetings_section_title: settings.aboutMeetingsSectionTitle,
    coaches_page_title: settings.coachesPageTitle,
    coaches_hero_description: settings.coachesHeroDescription,
    sponsors_page_title: settings.sponsorsPageTitle,
    sponsors_hero_description: settings.sponsorsHeroDescription,
    outreach_page_title: settings.outreachPageTitle,
    outreach_hero_description: settings.outreachHeroDescription,
    core_values_page_title: settings.coreValuesPageTitle,
    join_hero_description: settings.joinHeroDescription,
    join_next_steps: settings.joinNextSteps,
    join_success_title: settings.joinSuccessTitle,
    join_success_message: settings.joinSuccessMessage,
    hero_subtext: settings.heroSubtext,
    hero_primary_label: settings.heroPrimaryLabel,
    hero_primary_path: settings.heroPrimaryPath,
    hero_secondary_label: settings.heroSecondaryLabel,
    hero_secondary_path: settings.heroSecondaryPath,
    season_eyebrow: settings.seasonEyebrow,
    season_story_title: settings.seasonStoryTitle,
    season_story_body: settings.seasonStoryBody,
    season_story_link_label: settings.seasonStoryLinkLabel,
    season_name: settings.seasonName,
    season_playlist_id: settings.seasonPlaylistId,
    season_playlist_url: settings.seasonPlaylistUrl,
    season_resources_url: settings.seasonResourcesUrl,
    season_documents: settings.seasonDocuments,
    season_videos: settings.seasonVideos,
    season_video_groups: settings.seasonVideoGroups,
    quick_links: settings.quickLinks,
    what_we_do_title: settings.whatWeDoTitle,
    what_we_do_subtitle: settings.whatWeDoSubtitle,
    homepage_pillars: settings.homepagePillars,
    cta_title: settings.ctaTitle,
    cta_body: settings.ctaBody,
    cta_primary_label: settings.ctaPrimaryLabel,
    cta_primary_path: settings.ctaPrimaryPath,
    cta_secondary_label: settings.ctaSecondaryLabel,
    cta_secondary_path: settings.ctaSecondaryPath,
    core_values_intro: settings.coreValuesIntro,
    core_values_official_blurb: settings.coreValuesOfficialBlurb,
    core_values: settings.coreValues,
    gallery_hero_title: settings.galleryHeroTitle,
    gallery_hero_description: settings.galleryHeroDescription,
    gallery_empty_title: settings.galleryEmptyTitle,
    gallery_empty_message: settings.galleryEmptyMessage,
    gallery_share_button_label: settings.galleryShareButtonLabel,
    events_hero_title: settings.eventsHeroTitle,
    events_hero_description: settings.eventsHeroDescription,
    calendar_hero_title: settings.calendarHeroTitle,
    calendar_hero_description: settings.calendarHeroDescription,
    videos_hero_title: settings.videosHeroTitle,
    videos_hero_description: settings.videosHeroDescription,
    quick_links_hero_title: settings.quickLinksHeroTitle,
    quick_links_hero_description: settings.quickLinksHeroDescription,
    consent_hero_title: settings.consentHeroTitle,
    consent_hero_description: settings.consentHeroDescription,
    consent_intro_override: settings.consentIntroOverride,
    consent_terms_override: settings.consentTermsOverride,
    consent_both_parents_note_override: settings.consentBothParentsNoteOverride,
    consent_success_title: settings.consentSuccessTitle,
    consent_success_message: settings.consentSuccessMessage,
    assignments_intro: settings.assignmentsIntro,
    generic_coach_bio: settings.genericCoachBio,
    generic_member_bio: settings.genericMemberBio,
    footer_meet_team_label: settings.footerMeetTeamLabel,
    nav_links: settings.navLinks,
    footer_explore_links: settings.footerExploreLinks,
    footer_external_links: settings.footerExternalLinks,
    visit_bar_links: settings.visitBarLinks,
  };
}

export async function fetchSiteContentAdmin(): Promise<SiteContentAdminData> {
  const { fetchSiteSettings, fetchOutreachStories } = await import("@/lib/site-settings");
  const [settings, outreachStories] = await Promise.all([
    fetchSiteSettings(),
    fetchOutreachStories(),
  ]);
  return { settings, outreachStories };
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const tenantId = await tenantIdForQuery();
  let rowId = 1;
  const { data: existing, error: readError } = await withTenantFilter(
    db.from("site_settings").select("id"),
    tenantId,
  ).maybeSingle();
  if (readError) throw readError;
  if (existing?.id != null) {
    rowId = existing.id as number;
  } else {
    const { data: maxRow } = await db
      .from("site_settings")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    rowId = ((maxRow?.id as number | undefined) ?? 0) + 1;
  }

  const { error } = await db
    .from("site_settings")
    .upsert(settingsToRow(settings, tenantId, rowId), { onConflict: "tenant_id" });
  if (error) throw error;
}

export async function saveOutreachStories(stories: OutreachStoryRow[]): Promise<void> {
  const tenantId = await tenantIdForQuery();
  for (const story of stories) {
    const { error } = await db.from("outreach_stories").upsert(
      {
        id: story.id,
        tenant_id: tenantId,
        sort_order: story.sortOrder,
        title: story.title,
        description: story.description,
        image_key: story.imageKey,
        default_image_url: story.defaultImageUrl,
        default_image_alt: story.defaultImageAlt,
      },
      { onConflict: "tenant_id,id" },
    );
    if (error) throw error;
  }
}

export async function saveSiteContentAdmin(data: SiteContentAdminData): Promise<void> {
  await saveSiteSettings(data.settings);
  await saveOutreachStories(data.outreachStories);
}

export function emptySiteContentForm(): SiteContentAdminData {
  return {
    settings: structuredClone(DEFAULT_SITE_SETTINGS),
    outreachStories: [],
  };
}
