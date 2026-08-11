import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BRAND_COLOR, normalizeAccentColor, normalizeBrandColor } from "@/lib/brand-colors";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_CORE_VALUES_OFFICIAL_BLURB,
  DEFAULT_CTA_BUTTONS,
  DEFAULT_FOOTER_MEET_TEAM_LABEL,
  DEFAULT_GENERIC_COACH_BIO,
  DEFAULT_GENERIC_MEMBER_BIO,
  DEFAULT_HERO_BUTTONS,
  DEFAULT_QUICK_LINKS,
  DEFAULT_SEASON_CONTENT,
  DEFAULT_SEASON_VIDEO_GROUPS,
  type QuickLinkCard,
  type SeasonVideoGroup,
} from "@/lib/site-content-defaults";
import type { SeasonDocument, SeasonVideo } from "@/lib/season-videos";
import { isDemoMode } from "@/lib/demo/app-mode";
import { buildDemoSiteSettings, demoOutreachStories } from "@/lib/demo/demo-defaults";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

export type NavLinkItem =
  | { kind: "internal"; label: string; to: string }
  | { kind: "external"; label: string; href: string };

export type HomepagePillar = {
  title: string;
  copy: string;
  href?: string;
  linkLabel?: string;
};

export type CoreValueContent = {
  id: string;
  name: string;
  definition: string;
  howWeLiveIt: string;
};

export type { QuickLinkCard, SeasonVideoGroup } from "@/lib/site-content-defaults";
export type { SeasonDocument, SeasonVideo } from "@/lib/season-videos";

export type SiteSettings = {
  siteName: string;
  siteTagline: string;
  brandColor: string;
  accentColor: string;
  foundedYear: string;
  siteUrl: string;
  practiceTitle: string;
  practiceSummary: string;
  practicePlace: string;
  zoomTitle: string;
  zoomSummary: string;
  zoomPlace: string;
  zoomUrl: string | null;
  meetingsBlurb: string;
  meetingSummary: string;
  aboutBlurb: string;
  aboutPageTitle: string;
  aboutHeroDescription: string;
  aboutTeamSectionTitle: string;
  aboutMeetingsSectionTitle: string;
  coachesPageTitle: string;
  coachesHeroDescription: string;
  sponsorsPageTitle: string;
  sponsorsHeroDescription: string;
  outreachPageTitle: string;
  outreachHeroDescription: string;
  coreValuesPageTitle: string;
  joinHeroDescription: string;
  joinNextSteps: string[];
  joinSuccessTitle: string;
  joinSuccessMessage: string;
  heroSubtext: string;
  heroPrimaryLabel: string;
  heroPrimaryPath: string;
  heroSecondaryLabel: string;
  heroSecondaryPath: string;
  seasonEyebrow: string;
  seasonStoryTitle: string;
  seasonStoryBody: string;
  seasonStoryLinkLabel: string;
  seasonName: string;
  seasonPlaylistId: string;
  seasonPlaylistUrl: string;
  seasonResourcesUrl: string;
  seasonDocuments: SeasonDocument[];
  seasonVideos: SeasonVideo[];
  seasonVideoGroups: SeasonVideoGroup[];
  quickLinks: QuickLinkCard[];
  whatWeDoTitle: string;
  whatWeDoSubtitle: string;
  homepagePillars: HomepagePillar[];
  ctaTitle: string;
  ctaBody: string;
  ctaPrimaryLabel: string;
  ctaPrimaryPath: string;
  ctaSecondaryLabel: string;
  ctaSecondaryPath: string;
  coreValuesIntro: string;
  coreValuesOfficialBlurb: string;
  coreValues: CoreValueContent[];
  galleryHeroTitle: string;
  galleryHeroDescription: string;
  galleryEmptyTitle: string;
  galleryEmptyMessage: string;
  galleryShareButtonLabel: string;
  eventsHeroTitle: string;
  eventsHeroDescription: string;
  calendarHeroTitle: string;
  calendarHeroDescription: string;
  videosHeroTitle: string;
  videosHeroDescription: string;
  quickLinksHeroTitle: string;
  quickLinksHeroDescription: string;
  consentHeroTitle: string;
  consentHeroDescription: string;
  consentIntroOverride: string;
  consentTermsOverride: string[];
  consentBothParentsNoteOverride: string;
  consentSuccessTitle: string;
  consentSuccessMessage: string;
  assignmentsIntro: string;
  genericCoachBio: string;
  genericMemberBio: string;
  footerMeetTeamLabel: string;
  navLinks: NavLinkItem[];
  footerExploreLinks: NavLinkItem[];
  footerExternalLinks: NavLinkItem[];
  visitBarLinks: NavLinkItem[];
};

export type OutreachStoryRow = {
  id: string;
  sortOrder: number;
  title: string;
  description: string;
  imageKey: string;
  defaultImageUrl: string;
  defaultImageAlt: string;
};

export const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { kind: "internal", label: "Our Team", to: "/about" },
  { kind: "internal", label: "Coaches", to: "/coaches" },
  { kind: "internal", label: "Calendar", to: "/calendar" },
  { kind: "internal", label: "Assignments", to: "/assignments" },
  { kind: "internal", label: "Resources", to: "/resources" },
  { kind: "internal", label: "Gallery", to: "/gallery" },
  { kind: "internal", label: "Outreach", to: "/outreach" },
  { kind: "internal", label: "Sponsors", to: "/sponsors" },
];

export const DEFAULT_FOOTER_EXPLORE_LINKS: NavLinkItem[] = [
  { kind: "internal", label: "Our Team", to: "/about" },
  { kind: "internal", label: "Coaches", to: "/coaches" },
  { kind: "internal", label: "Calendar", to: "/calendar" },
  { kind: "internal", label: "Assignments", to: "/assignments" },
  { kind: "internal", label: "Gallery", to: "/gallery" },
  { kind: "internal", label: "Resources", to: "/resources" },
  { kind: "internal", label: "Outreach", to: "/outreach" },
  { kind: "internal", label: "Sponsors", to: "/sponsors" },
  { kind: "internal", label: "Core Values", to: "/core-values" },
];

export const DEFAULT_FOOTER_EXTERNAL_LINKS: NavLinkItem[] = [
  { kind: "external", label: "FIRST LEGO League", href: "https://www.firstlegoleague.org/" },
  { kind: "external", label: "FIRST Inspires", href: "https://www.firstinspires.org/" },
];

export const DEFAULT_VISIT_BAR_LINKS: NavLinkItem[] = [
  { kind: "internal", label: "Calendar", to: "/calendar" },
  { kind: "internal", label: "Assignments", to: "/assignments" },
];

export const DEFAULT_HOMEPAGE_PILLARS: HomepagePillar[] = [
  {
    title: "Innovation Project",
    copy: "Dig into the season theme, find a real problem worth solving, and present a solution we're proud to defend.",
  },
  {
    title: "Robot Design & Code",
    copy: "Design mechanisms, write mission runs, and keep refining until the robot does the job on its own.",
  },
  {
    title: "Core Values",
    copy: "Discovery, Innovation, Impact, Inclusion, Teamwork, and Fun—how we treat each other when the run fails and when it lands.",
    href: "/core-values",
    linkLabel: "Read our Core Values →",
  },
];

export const DEFAULT_CORE_VALUES: CoreValueContent[] = [
  {
    id: "discovery",
    name: "Discovery",
    definition: "We explore new skills and ideas.",
    howWeLiveIt:
      "In meetings and at competitions, Bits & Bots teammates try new builds, coding approaches, and research methods. We treat every practice as a chance to learn something we did not know before.",
  },
  {
    id: "innovation",
    name: "Innovation",
    definition: "We use creativity and persistence to solve problems.",
    howWeLiveIt:
      "When a mission or project challenge stalls, we brainstorm together, test ideas, and keep iterating. Creativity and steady effort matter more than getting it right on the first try.",
  },
  {
    id: "impact",
    name: "Impact",
    definition: "We apply what we learn to improve our world.",
    howWeLiveIt:
      "Our Innovation Project and community workshops connect season learning to real people. We look for ways our ideas and outreach can help others beyond the robot table.",
  },
  {
    id: "inclusion",
    name: "Inclusion",
    definition: "We respect each other and embrace our differences.",
    howWeLiveIt:
      "Everyone on Bits & Bots has a voice in planning, building, and presenting. We welcome different strengths and make space for every teammate to contribute.",
  },
  {
    id: "teamwork",
    name: "Teamwork",
    definition: "We are stronger when we work together.",
    howWeLiveIt:
      "Practices and competition days are shared work. We divide roles, support one another under pressure, and celebrate progress as a team—not as individuals competing for credit.",
  },
  {
    id: "fun",
    name: "Fun",
    definition: "We enjoy and celebrate what we do!",
    howWeLiveIt:
      "We keep meetings energetic, cheer for hard-earned improvements, and enjoy the friendships that grow through FIRST LEGO League. Learning sticks best when the season feels joyful.",
  },
];

export const PRODUCTION_OUTREACH_STORIES: OutreachStoryRow[] = [
  {
    id: "mentoring-teams",
    sortOrder: 0,
    title: "Mentoring new FLL teams",
    description:
      "Bits & Bots has mentored and helped found two new FIRST LEGO League teams. We share meeting routines, robot-game basics, and Core Values practices so new coaches and students can start their season with confidence.",
    imageKey: "outreachMentoring",
    defaultImageUrl: "/photos/outreach/mentoring-teams.png",
    defaultImageAlt: "Mentors and youth building LEGO robots together",
  },
  {
    id: "india-fest",
    sortOrder: 1,
    title: "India Fest workshops",
    description:
      "At community celebrations such as India Fest, our team runs hands-on workshops where visitors can try simple builds, learn about FIRST LEGO League, and see how robotics connects creativity, coding, and teamwork.",
    imageKey: "outreachIndiaFest",
    defaultImageUrl: "/photos/outreach/india-fest.png",
    defaultImageAlt: "Community festival with STEM activity tables",
  },
  {
    id: "steam-expo",
    sortOrder: 2,
    title: "STEAM Expo at Collier County",
    description:
      "We host workshops at STEAM Expo events in Collier County, inviting families to explore robotics stations, ask questions about FIRST LEGO League, and discover how youth can learn STEM through friendly competition and collaboration.",
    imageKey: "outreachSteamExpo",
    defaultImageUrl: "/photos/outreach/steam-expo.png",
    defaultImageAlt: "STEAM expo with robotics and science stations",
  },
];

export const DEFAULT_JOIN_NEXT_STEPS = [
  "A coach replies within a few days.",
  "We'll invite you to a Sunday practice to visit.",
  "No special gear needed for your first visit.",
  "FIRST LEGO League Challenge is typically for ages 9–16 (grades 4–8).",
];

export const DEFAULT_OUTREACH_STORIES: OutreachStoryRow[] = isDemoMode
  ? demoOutreachStories(PRODUCTION_OUTREACH_STORIES)
  : PRODUCTION_OUTREACH_STORIES;

export const PRODUCTION_SITE_SETTINGS: SiteSettings = {
  siteName: "Bits & Bots",
  siteTagline: "Community Robotics Team · Collier County",
  brandColor: DEFAULT_BRAND_COLOR,
  accentColor: DEFAULT_ACCENT_COLOR,
  foundedYear: "2024",
  siteUrl: "https://fllbots.com",
  practiceTitle: "Team practice",
  practiceSummary: "Sundays · 3:00–5:00 PM",
  practicePlace: "TBD",
  zoomTitle: "Zoom call",
  zoomSummary: "Wednesdays · 6:00–6:30 PM",
  zoomPlace: "Online · Zoom",
  zoomUrl: null,
  meetingsBlurb:
    "Team practice Sundays 3:00–5:00 PM (location TBD), plus a Wednesday Zoom call 6:00–6:30 PM.",
  meetingSummary: "Sundays 3–5 · Wednesdays Zoom 6–6:30",
  aboutBlurb:
    "We are a community robotics team from Collier County, Florida, competing in FIRST LEGO League Challenge. Each season we research a real-world theme, design and program LEGO robots for the Robot Game, and practice Core Values like discovery, innovation, impact, inclusion, teamwork, and fun.",
  aboutPageTitle: "Our Team",
  aboutHeroDescription:
    "Bits & Bots is a FIRST LEGO League team founded in 2024. Team practice Sundays 3:00–5:00 PM (location TBD), plus a Wednesday Zoom call 6:00–6:30 PM.",
  aboutTeamSectionTitle: "Team members",
  aboutMeetingsSectionTitle: "When we meet",
  coachesPageTitle: "Coaches",
  coachesHeroDescription:
    "The coaches who guide Bits & Bots through builds, coding, Core Values, and competition season.",
  sponsorsPageTitle: "Sponsors",
  sponsorsHeroDescription:
    "Community partners help Bits & Bots build, compete, and share FIRST LEGO League with others.",
  outreachPageTitle: "Outreach",
  outreachHeroDescription:
    "Bits & Bots shares FIRST LEGO League beyond our own meetings—mentoring new teams and hosting workshops at community events.",
  coreValuesPageTitle: "Core Values",
  joinHeroDescription:
    "Send a short message and a coach will follow up. You can also visit a Sunday team practice.",
  joinNextSteps: DEFAULT_JOIN_NEXT_STEPS,
  joinSuccessTitle: "Message sent",
  joinSuccessMessage: "Thanks for reaching out. A coach will reply within a few days.",
  heroSubtext:
    "We research the season challenge, build robots that score on the table, and practice Core Values every Sunday—then take that energy into outreach.",
  heroPrimaryLabel: DEFAULT_HERO_BUTTONS.primary.label,
  heroPrimaryPath: DEFAULT_HERO_BUTTONS.primary.path,
  heroSecondaryLabel: DEFAULT_HERO_BUTTONS.secondary.label,
  heroSecondaryPath: DEFAULT_HERO_BUTTONS.secondary.path,
  seasonEyebrow: "This season",
  seasonStoryTitle: "Built for the challenge—shared beyond the table",
  seasonStoryBody:
    "Bits & Bots is a FIRST LEGO League Challenge team. We split practice between the Innovation Project, Robot Design & Code, and Core Values—then mentor newer teams and run workshops so more kids can try FLL.",
  seasonStoryLinkLabel: "How we show up in the community",
  seasonName: DEFAULT_SEASON_CONTENT.seasonName,
  seasonPlaylistId: DEFAULT_SEASON_CONTENT.seasonPlaylistId,
  seasonPlaylistUrl: DEFAULT_SEASON_CONTENT.seasonPlaylistUrl,
  seasonResourcesUrl: DEFAULT_SEASON_CONTENT.seasonResourcesUrl,
  seasonDocuments: DEFAULT_SEASON_CONTENT.seasonDocuments,
  seasonVideos: DEFAULT_SEASON_CONTENT.seasonVideos,
  seasonVideoGroups: DEFAULT_SEASON_CONTENT.seasonVideoGroups,
  quickLinks: DEFAULT_SEASON_CONTENT.quickLinks,
  whatWeDoTitle: "How FLL Challenge works for us",
  whatWeDoSubtitle: "Three parts. One team. Every meeting leans into at least one of them.",
  homepagePillars: DEFAULT_HOMEPAGE_PILLARS,
  ctaTitle: "Come to a practice",
  ctaBody:
    "Team practice Sundays 3:00–5:00 PM (location TBD), plus a Wednesday Zoom call 6:00–6:30 PM. Watch a mission run, hear an Innovation idea, or just say hello.",
  ctaPrimaryLabel: DEFAULT_CTA_BUTTONS.primary.label,
  ctaPrimaryPath: DEFAULT_CTA_BUTTONS.primary.path,
  ctaSecondaryLabel: DEFAULT_CTA_BUTTONS.secondary.label,
  ctaSecondaryPath: DEFAULT_CTA_BUTTONS.secondary.path,
  coreValuesIntro:
    "The FIRST Core Values guide how Bits & Bots learns, competes, and works with others. Official definitions below are from FIRST / FIRST LEGO League.",
  coreValuesOfficialBlurb: DEFAULT_CORE_VALUES_OFFICIAL_BLURB,
  coreValues: DEFAULT_CORE_VALUES,
  galleryHeroTitle: "Photo gallery",
  galleryHeroDescription: "Approved photos from practices, builds, and FLL events.",
  galleryEmptyTitle: "No photos yet.",
  galleryEmptyMessage: "Share photos below — a coach approves them before they appear here.",
  galleryShareButtonLabel: "Share your photos",
  eventsHeroTitle: "Upcoming meetings",
  eventsHeroDescription: "Team practice on Sundays and Zoom check-ins on Wednesdays.",
  calendarHeroTitle: "Calendar",
  calendarHeroDescription: "Practices, Zoom calls, and team events.",
  videosHeroTitle: "Resources",
  videosHeroDescription:
    "Official season videos and PDFs, plus FIRST LEGO League links — everything in one place.",
  quickLinksHeroTitle: "Resources",
  quickLinksHeroDescription:
    "Official season videos and PDFs, plus FIRST LEGO League links for Bits & Bots families.",
  consentHeroTitle: "Photo & Media Consent",
  consentHeroDescription: "Permission for Bits & Bots to share team photos and videos.",
  consentIntroOverride: "",
  consentTermsOverride: [],
  consentBothParentsNoteOverride: "",
  consentSuccessTitle: "Consent saved",
  consentSuccessMessage:
    "Thank you. Coaches have your signed permission on file.",
  assignmentsIntro:
    "This page is for Bits & Bots team members only. On your first visit, choose your name and create a private 4-digit PIN. After that, enter your PIN each time you sign in to view and update your tasks. If you forget your PIN, ask a coach — they can reset it so you can set a new one.",
  genericCoachBio: DEFAULT_GENERIC_COACH_BIO,
  genericMemberBio: DEFAULT_GENERIC_MEMBER_BIO,
  footerMeetTeamLabel: DEFAULT_FOOTER_MEET_TEAM_LABEL,
  navLinks: DEFAULT_NAV_LINKS,
  footerExploreLinks: DEFAULT_FOOTER_EXPLORE_LINKS,
  footerExternalLinks: DEFAULT_FOOTER_EXTERNAL_LINKS,
  visitBarLinks: DEFAULT_VISIT_BAR_LINKS,
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = isDemoMode
  ? buildDemoSiteSettings(PRODUCTION_SITE_SETTINGS)
  : PRODUCTION_SITE_SETTINGS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const RESOURCES_NAV_LINK: NavLinkItem = { kind: "internal", label: "Resources", to: "/resources" };

function isLegacyResourcesNavItem(item: NavLinkItem): boolean {
  if (item.kind === "internal") {
    return item.to === "/videos" || item.to === "/quick-links" || item.label === "Videos" || item.label === "Quick Links";
  }
  return item.label === "Resources";
}

const SPONSORS_NAV_LINK: NavLinkItem = { kind: "internal", label: "Sponsors", to: "/sponsors" };

function ensureSponsorsAfterOutreach(links: NavLinkItem[]): NavLinkItem[] {
  if (links.some((item) => item.kind === "internal" && item.to === "/sponsors")) {
    return links;
  }
  const outreachIndex = links.findIndex((item) => item.kind === "internal" && item.to === "/outreach");
  const insertAt = outreachIndex >= 0 ? outreachIndex + 1 : links.length;
  const next = [...links];
  next.splice(insertAt, 0, SPONSORS_NAV_LINK);
  return next;
}

function mergeNavLinksForResources(links: NavLinkItem[], fallback: NavLinkItem[]): NavLinkItem[] {
  const base = links.length ? links : fallback;
  let changed = false;
  const filtered = base.filter((item) => {
    if (isLegacyResourcesNavItem(item)) {
      changed = true;
      return false;
    }
    return true;
  });

  const hasResources = filtered.some(
    (item) => item.kind === "internal" && item.to === "/resources",
  );
  if (!hasResources) {
    changed = true;
    const afterAssignments = filtered.findIndex(
      (item) => item.kind === "internal" && item.to === "/assignments",
    );
    const insertAt = afterAssignments >= 0 ? afterAssignments + 1 : filtered.length;
    filtered.splice(insertAt, 0, RESOURCES_NAV_LINK);
  }

  return changed || !links.length ? filtered : links;
}

function normalizeInternalPath(path: string): string {
  if (path === "/videos" || path === "/quick-links") return "/resources";
  return path;
}

function parseNavLinks(
  value: unknown,
  fallback: NavLinkItem[],
  options?: { ensureSponsorsAfterOutreach?: boolean },
): NavLinkItem[] {
  if (!Array.isArray(value)) {
    return options?.ensureSponsorsAfterOutreach
      ? ensureSponsorsAfterOutreach(fallback)
      : fallback;
  }
  const parsed = value.filter(
    (item): item is NavLinkItem =>
      !!item &&
      typeof item === "object" &&
      typeof (item as NavLinkItem).label === "string" &&
      ((item as NavLinkItem).kind === "internal"
        ? typeof (item as { to?: string }).to === "string"
        : typeof (item as { href?: string }).href === "string"),
  );
  const mapped = parsed.map((item) =>
    item.kind === "internal" ? { ...item, to: normalizeInternalPath(item.to) } : item,
  );
  let result = mergeNavLinksForResources(mapped, fallback);
  if (options?.ensureSponsorsAfterOutreach) {
    result = ensureSponsorsAfterOutreach(result);
  }
  return result;
}

function parsePillars(value: unknown): HomepagePillar[] {
  if (!Array.isArray(value)) return DEFAULT_HOMEPAGE_PILLARS;
  const parsed = value
    .filter((item) => item && typeof item === "object" && typeof (item as HomepagePillar).title === "string")
    .map((item) => ({
      title: String((item as HomepagePillar).title),
      copy: String((item as HomepagePillar).copy ?? ""),
      href: (item as HomepagePillar).href || undefined,
      linkLabel: (item as HomepagePillar).linkLabel || undefined,
    }));
  return parsed.length ? parsed : DEFAULT_HOMEPAGE_PILLARS;
}

function parseCoreValues(value: unknown): CoreValueContent[] {
  if (!Array.isArray(value)) return DEFAULT_CORE_VALUES;
  const parsed = value
    .filter((item) => item && typeof item === "object" && typeof (item as CoreValueContent).id === "string")
    .map((item) => ({
      id: String((item as CoreValueContent).id),
      name: String((item as CoreValueContent).name ?? ""),
      definition: String((item as CoreValueContent).definition ?? ""),
      howWeLiveIt: String((item as CoreValueContent).howWeLiveIt ?? ""),
    }));
  return parsed.length ? parsed : DEFAULT_CORE_VALUES;
}

function parseStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const parsed = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return parsed.length ? parsed : fallback;
}

function parseSeasonDocuments(value: unknown): SeasonDocument[] {
  if (!Array.isArray(value)) return DEFAULT_SEASON_CONTENT.seasonDocuments;
  const parsed = value
    .filter((item) => item && typeof item === "object" && typeof (item as SeasonDocument).id === "string")
    .map((item) => ({
      id: String((item as SeasonDocument).id),
      title: String((item as SeasonDocument).title ?? ""),
      blurb: String((item as SeasonDocument).blurb ?? ""),
      href: String((item as SeasonDocument).href ?? ""),
    }))
    .filter((doc) => doc.title && doc.href);
  return parsed.length ? parsed : DEFAULT_SEASON_CONTENT.seasonDocuments;
}

function parseSeasonVideos(value: unknown): SeasonVideo[] {
  if (!Array.isArray(value)) return DEFAULT_SEASON_CONTENT.seasonVideos;
  const parsed = value
    .filter((item) => item && typeof item === "object" && typeof (item as SeasonVideo).id === "string")
    .map((item) => ({
      id: String((item as SeasonVideo).id),
      title: String((item as SeasonVideo).title ?? ""),
      blurb: String((item as SeasonVideo).blurb ?? ""),
      group: (["season", "game", "roles"].includes(String((item as SeasonVideo).group))
        ? (item as SeasonVideo).group
        : "season") as SeasonVideo["group"],
    }))
    .filter((video) => video.title);
  return parsed.length ? parsed : DEFAULT_SEASON_CONTENT.seasonVideos;
}

function parseSeasonVideoGroups(value: unknown): SeasonVideoGroup[] {
  if (!Array.isArray(value)) return DEFAULT_SEASON_CONTENT.seasonVideoGroups;
  const parsed = value
    .filter((item) => item && typeof item === "object" && typeof (item as SeasonVideoGroup).key === "string")
    .map((item) => ({
      key: (["season", "game", "roles"].includes(String((item as SeasonVideoGroup).key))
        ? (item as SeasonVideoGroup).key
        : "season") as SeasonVideoGroup["key"],
      title: String((item as SeasonVideoGroup).title ?? ""),
      copy: String((item as SeasonVideoGroup).copy ?? ""),
    }))
    .filter((group) => group.title);
  return parsed.length ? parsed : DEFAULT_SEASON_CONTENT.seasonVideoGroups;
}

function parseQuickLinks(value: unknown): QuickLinkCard[] {
  if (!Array.isArray(value)) return DEFAULT_SEASON_CONTENT.quickLinks;
  const parsed = value
    .filter((item) => item && typeof item === "object" && typeof (item as QuickLinkCard).id === "string")
    .map((item) => ({
      id: String((item as QuickLinkCard).id),
      label: String((item as QuickLinkCard).label ?? ""),
      href: String((item as QuickLinkCard).href ?? ""),
      desc: String((item as QuickLinkCard).desc ?? ""),
    }))
    .filter((link) => link.label && link.href);
  return parsed.length ? parsed : DEFAULT_SEASON_CONTENT.quickLinks;
}

function mapSettingsRow(row: Record<string, unknown>): SiteSettings {
  return {
    siteName: String(row.site_name ?? DEFAULT_SITE_SETTINGS.siteName),
    siteTagline: String(row.site_tagline ?? DEFAULT_SITE_SETTINGS.siteTagline),
    brandColor: normalizeBrandColor(
      String(row.brand_color ?? DEFAULT_SITE_SETTINGS.brandColor),
    ),
    accentColor: normalizeAccentColor(
      String(row.accent_color ?? DEFAULT_SITE_SETTINGS.accentColor),
    ),
    foundedYear: String(row.founded_year ?? DEFAULT_SITE_SETTINGS.foundedYear),
    siteUrl: String(row.site_url ?? DEFAULT_SITE_SETTINGS.siteUrl),
    practiceTitle: String(row.practice_title ?? DEFAULT_SITE_SETTINGS.practiceTitle),
    practiceSummary: String(row.practice_summary ?? DEFAULT_SITE_SETTINGS.practiceSummary),
    practicePlace: String(row.practice_place ?? DEFAULT_SITE_SETTINGS.practicePlace),
    zoomTitle: String(row.zoom_title ?? DEFAULT_SITE_SETTINGS.zoomTitle),
    zoomSummary: String(row.zoom_summary ?? DEFAULT_SITE_SETTINGS.zoomSummary),
    zoomPlace: String(row.zoom_place ?? DEFAULT_SITE_SETTINGS.zoomPlace),
    zoomUrl: row.zoom_url ? String(row.zoom_url) : null,
    meetingsBlurb: String(row.meetings_blurb ?? DEFAULT_SITE_SETTINGS.meetingsBlurb),
    meetingSummary: String(row.meeting_summary ?? DEFAULT_SITE_SETTINGS.meetingSummary),
    aboutBlurb: String(row.about_blurb ?? DEFAULT_SITE_SETTINGS.aboutBlurb),
    aboutPageTitle: String(row.about_page_title ?? DEFAULT_SITE_SETTINGS.aboutPageTitle),
    aboutHeroDescription: String(row.about_hero_description ?? DEFAULT_SITE_SETTINGS.aboutHeroDescription),
    aboutTeamSectionTitle: String(row.about_team_section_title ?? DEFAULT_SITE_SETTINGS.aboutTeamSectionTitle),
    aboutMeetingsSectionTitle: String(row.about_meetings_section_title ?? DEFAULT_SITE_SETTINGS.aboutMeetingsSectionTitle),
    coachesPageTitle: String(row.coaches_page_title ?? DEFAULT_SITE_SETTINGS.coachesPageTitle),
    coachesHeroDescription: String(row.coaches_hero_description ?? DEFAULT_SITE_SETTINGS.coachesHeroDescription),
    sponsorsPageTitle: String(row.sponsors_page_title ?? DEFAULT_SITE_SETTINGS.sponsorsPageTitle),
    sponsorsHeroDescription: String(row.sponsors_hero_description ?? DEFAULT_SITE_SETTINGS.sponsorsHeroDescription),
    outreachPageTitle: String(row.outreach_page_title ?? DEFAULT_SITE_SETTINGS.outreachPageTitle),
    outreachHeroDescription: String(row.outreach_hero_description ?? DEFAULT_SITE_SETTINGS.outreachHeroDescription),
    coreValuesPageTitle: String(row.core_values_page_title ?? DEFAULT_SITE_SETTINGS.coreValuesPageTitle),
    joinHeroDescription: String(row.join_hero_description ?? DEFAULT_SITE_SETTINGS.joinHeroDescription),
    joinNextSteps: parseStringArray(row.join_next_steps, DEFAULT_JOIN_NEXT_STEPS),
    joinSuccessTitle: String(row.join_success_title ?? DEFAULT_SITE_SETTINGS.joinSuccessTitle),
    joinSuccessMessage: String(row.join_success_message ?? DEFAULT_SITE_SETTINGS.joinSuccessMessage),
    heroSubtext: String(row.hero_subtext ?? DEFAULT_SITE_SETTINGS.heroSubtext),
    heroPrimaryLabel: String(row.hero_primary_label ?? DEFAULT_SITE_SETTINGS.heroPrimaryLabel),
    heroPrimaryPath: normalizeInternalPath(String(row.hero_primary_path ?? DEFAULT_SITE_SETTINGS.heroPrimaryPath)),
    heroSecondaryLabel: String(row.hero_secondary_label ?? DEFAULT_SITE_SETTINGS.heroSecondaryLabel),
    heroSecondaryPath: normalizeInternalPath(String(row.hero_secondary_path ?? DEFAULT_SITE_SETTINGS.heroSecondaryPath)),
    seasonEyebrow: String(row.season_eyebrow ?? DEFAULT_SITE_SETTINGS.seasonEyebrow),
    seasonStoryTitle: String(row.season_story_title ?? DEFAULT_SITE_SETTINGS.seasonStoryTitle),
    seasonStoryBody: String(row.season_story_body ?? DEFAULT_SITE_SETTINGS.seasonStoryBody),
    seasonStoryLinkLabel: String(row.season_story_link_label ?? DEFAULT_SITE_SETTINGS.seasonStoryLinkLabel),
    seasonName: String(row.season_name ?? DEFAULT_SITE_SETTINGS.seasonName),
    seasonPlaylistId: String(row.season_playlist_id ?? DEFAULT_SITE_SETTINGS.seasonPlaylistId),
    seasonPlaylistUrl: String(row.season_playlist_url ?? DEFAULT_SITE_SETTINGS.seasonPlaylistUrl),
    seasonResourcesUrl: String(row.season_resources_url ?? DEFAULT_SITE_SETTINGS.seasonResourcesUrl),
    seasonDocuments: parseSeasonDocuments(row.season_documents),
    seasonVideos: parseSeasonVideos(row.season_videos),
    seasonVideoGroups: parseSeasonVideoGroups(row.season_video_groups),
    quickLinks: parseQuickLinks(row.quick_links),
    whatWeDoTitle: String(row.what_we_do_title ?? DEFAULT_SITE_SETTINGS.whatWeDoTitle),
    whatWeDoSubtitle: String(row.what_we_do_subtitle ?? DEFAULT_SITE_SETTINGS.whatWeDoSubtitle),
    homepagePillars: parsePillars(row.homepage_pillars),
    ctaTitle: String(row.cta_title ?? DEFAULT_SITE_SETTINGS.ctaTitle),
    ctaBody: String(row.cta_body ?? DEFAULT_SITE_SETTINGS.ctaBody),
    ctaPrimaryLabel: String(row.cta_primary_label ?? DEFAULT_SITE_SETTINGS.ctaPrimaryLabel),
    ctaPrimaryPath: String(row.cta_primary_path ?? DEFAULT_SITE_SETTINGS.ctaPrimaryPath),
    ctaSecondaryLabel: String(row.cta_secondary_label ?? DEFAULT_SITE_SETTINGS.ctaSecondaryLabel),
    ctaSecondaryPath: String(row.cta_secondary_path ?? DEFAULT_SITE_SETTINGS.ctaSecondaryPath),
    coreValuesIntro: String(row.core_values_intro ?? DEFAULT_SITE_SETTINGS.coreValuesIntro),
    coreValuesOfficialBlurb: String(row.core_values_official_blurb ?? DEFAULT_SITE_SETTINGS.coreValuesOfficialBlurb),
    coreValues: parseCoreValues(row.core_values),
    galleryHeroTitle: String(row.gallery_hero_title ?? DEFAULT_SITE_SETTINGS.galleryHeroTitle),
    galleryHeroDescription: String(row.gallery_hero_description ?? DEFAULT_SITE_SETTINGS.galleryHeroDescription),
    galleryEmptyTitle: String(row.gallery_empty_title ?? DEFAULT_SITE_SETTINGS.galleryEmptyTitle),
    galleryEmptyMessage: String(row.gallery_empty_message ?? DEFAULT_SITE_SETTINGS.galleryEmptyMessage),
    galleryShareButtonLabel: String(row.gallery_share_button_label ?? DEFAULT_SITE_SETTINGS.galleryShareButtonLabel),
    eventsHeroTitle: String(row.events_hero_title ?? DEFAULT_SITE_SETTINGS.eventsHeroTitle),
    eventsHeroDescription: String(row.events_hero_description ?? DEFAULT_SITE_SETTINGS.eventsHeroDescription),
    calendarHeroTitle: String(row.calendar_hero_title ?? DEFAULT_SITE_SETTINGS.calendarHeroTitle),
    calendarHeroDescription: String(row.calendar_hero_description ?? DEFAULT_SITE_SETTINGS.calendarHeroDescription),
    videosHeroTitle: String(row.videos_hero_title ?? DEFAULT_SITE_SETTINGS.videosHeroTitle),
    videosHeroDescription: String(row.videos_hero_description ?? DEFAULT_SITE_SETTINGS.videosHeroDescription),
    quickLinksHeroTitle: String(row.quick_links_hero_title ?? DEFAULT_SITE_SETTINGS.quickLinksHeroTitle),
    quickLinksHeroDescription: String(row.quick_links_hero_description ?? DEFAULT_SITE_SETTINGS.quickLinksHeroDescription),
    consentHeroTitle: String(row.consent_hero_title ?? DEFAULT_SITE_SETTINGS.consentHeroTitle),
    consentHeroDescription: String(row.consent_hero_description ?? DEFAULT_SITE_SETTINGS.consentHeroDescription),
    consentIntroOverride: String(row.consent_intro_override ?? DEFAULT_SITE_SETTINGS.consentIntroOverride),
    consentTermsOverride: parseStringArray(row.consent_terms_override, DEFAULT_SITE_SETTINGS.consentTermsOverride),
    consentBothParentsNoteOverride: String(row.consent_both_parents_note_override ?? DEFAULT_SITE_SETTINGS.consentBothParentsNoteOverride),
    consentSuccessTitle: String(row.consent_success_title ?? DEFAULT_SITE_SETTINGS.consentSuccessTitle),
    consentSuccessMessage: String(row.consent_success_message ?? DEFAULT_SITE_SETTINGS.consentSuccessMessage),
    assignmentsIntro: String(row.assignments_intro ?? DEFAULT_SITE_SETTINGS.assignmentsIntro),
    genericCoachBio: String(row.generic_coach_bio ?? DEFAULT_SITE_SETTINGS.genericCoachBio),
    genericMemberBio: String(row.generic_member_bio ?? DEFAULT_SITE_SETTINGS.genericMemberBio),
    footerMeetTeamLabel: String(row.footer_meet_team_label ?? DEFAULT_SITE_SETTINGS.footerMeetTeamLabel),
    navLinks: parseNavLinks(row.nav_links, DEFAULT_NAV_LINKS, { ensureSponsorsAfterOutreach: true }),
    footerExploreLinks: parseNavLinks(row.footer_explore_links, DEFAULT_FOOTER_EXPLORE_LINKS),
    footerExternalLinks: parseNavLinks(row.footer_external_links, DEFAULT_FOOTER_EXTERNAL_LINKS),
    visitBarLinks: parseNavLinks(row.visit_bar_links, DEFAULT_VISIT_BAR_LINKS),
  };
}

function mapOutreachRow(row: Record<string, unknown>): OutreachStoryRow {
  return {
    id: String(row.id),
    sortOrder: Number(row.sort_order ?? 0),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    imageKey: String(row.image_key ?? ""),
    defaultImageUrl: String(row.default_image_url ?? ""),
    defaultImageAlt: String(row.default_image_alt ?? ""),
  };
}

export function siteSettingsErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error ?? "Request failed");
}

export function isSiteSettingsSetupMissing(error: unknown): boolean {
  const message = siteSettingsErrorMessage(error).toLowerCase();
  return (
    message.includes("site_settings") ||
    message.includes("outreach_stories") ||
    message.includes("schema cache") ||
    message.includes("could not find the table")
  );
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const tenantId = await tenantIdForQuery();
  let query = db.from("site_settings").select("*");
  query = withTenantFilter(query, tenantId);
  const { data, error } = await query.maybeSingle();
  if (error) {
    if (isSiteSettingsSetupMissing(error)) return DEFAULT_SITE_SETTINGS;
    throw error;
  }
  if (!data) return DEFAULT_SITE_SETTINGS;
  return mapSettingsRow(data as Record<string, unknown>);
}

export async function fetchOutreachStories(): Promise<OutreachStoryRow[]> {
  const tenantId = await tenantIdForQuery();
  let query = db.from("outreach_stories").select("*").order("sort_order", { ascending: true });
  query = withTenantFilter(query, tenantId);
  const { data, error } = await query;
  if (error) throw error;
  if (!data?.length) return DEFAULT_OUTREACH_STORIES;
  return (data as Record<string, unknown>[]).map(mapOutreachRow);
}

/** Replace a previous team name everywhere it appears in a string. */
export function replaceTeamNameInText(text: string, previousName: string, newName: string): string {
  if (!text || !previousName || previousName === newName) return text;
  return text.split(previousName).join(newName);
}

/** Safety net at render time — swap bundled default name for live site_settings name. */
export function displayTeamNameText(text: string, siteName: string): string {
  if (!text || siteName === DEFAULT_SITE_SETTINGS.siteName) return text;
  return replaceTeamNameInText(text, DEFAULT_SITE_SETTINGS.siteName, siteName);
}

function replaceTeamNameDeep(value: unknown, previousName: string, newName: string): unknown {
  if (typeof value === "string") return replaceTeamNameInText(value, previousName, newName);
  if (Array.isArray(value)) {
    return value.map((item) => replaceTeamNameDeep(item, previousName, newName));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = replaceTeamNameDeep(nested, previousName, newName);
    }
    return out;
  }
  return value;
}

/** When team name changes, update it in all site copy fields before saving. */
export function propagateTeamNameChange(
  settings: SiteSettings,
  previousName: string,
  newName: string,
): SiteSettings {
  const trimmed = newName.trim() || DEFAULT_SITE_SETTINGS.siteName;
  if (!previousName.trim() || previousName.trim() === trimmed) {
    return { ...settings, siteName: trimmed };
  }
  const updated = replaceTeamNameDeep(settings, previousName.trim(), trimmed) as SiteSettings;
  updated.siteName = trimmed;
  return updated;
}

export function propagateTeamNameInOutreach(
  stories: OutreachStoryRow[],
  previousName: string,
  newName: string,
): OutreachStoryRow[] {
  if (!previousName.trim() || previousName.trim() === newName.trim()) return stories;
  const prev = previousName.trim();
  const next = newName.trim();
  return stories.map((story) => ({
    ...story,
    title: replaceTeamNameInText(story.title, prev, next),
    description: replaceTeamNameInText(story.description, prev, next),
    defaultImageAlt: replaceTeamNameInText(story.defaultImageAlt, prev, next),
  }));
}

export function settingsToPhotosCompat(settings: SiteSettings) {
  return {
    SITE_NAME: settings.siteName,
    SITE_TAGLINE: settings.siteTagline,
    FOUNDED_YEAR: settings.foundedYear,
    PRACTICE_TITLE: settings.practiceTitle,
    PRACTICE_SUMMARY: settings.practiceSummary,
    PRACTICE_PLACE: settings.practicePlace,
    ZOOM_TITLE: settings.zoomTitle,
    ZOOM_SUMMARY: settings.zoomSummary,
    ZOOM_PLACE: settings.zoomPlace,
    ZOOM_URL: settings.zoomUrl,
    MEETINGS_BLURB: settings.meetingsBlurb,
    MEETING_SUMMARY: settings.meetingSummary,
    MEETING_PLACE: settings.practicePlace,
  };
}
