import { demoSiteName, demoSiteOrigin } from "@/lib/demo/app-mode";
import { demoAssets } from "@/lib/demo/demo-assets";
import type { OutreachStoryRow, SiteSettings } from "@/lib/site-settings";

/** Partial overrides applied when VITE_DEMO_MODE=true. */
export const DEMO_SITE_SETTINGS_OVERRIDES: Partial<SiteSettings> = {
  siteName: demoSiteName,
  siteTagline: "FIRST LEGO League · Demo & play",
  siteUrl: demoSiteOrigin,
  foundedYear: "2025",
  aboutBlurb:
    "This is a demo team site for coaches to explore. Customize names, photos, calendar, and copy in Admin — everything you change is saved for when the site goes live.",
  aboutHeroDescription:
    "Demo Robotics Team is a sample FIRST LEGO League site. Edit content inline or in Admin → Site content.",
  coachesHeroDescription:
    "Sample coaches — replace names, photos, and bios with your real coaching team.",
  sponsorsHeroDescription:
    "Sample sponsors — add your community partners and upload their logos.",
  outreachHeroDescription:
    "Sample outreach stories — tell how your team shares FLL in the community.",
  heroSubtext:
    "Explore the site, try Admin tools, and customize every page. Your edits stay here when you go live.",
  seasonStoryTitle: "Built for the challenge—shared beyond the table",
  seasonStoryBody:
    "Demo Robotics Team shows how an FLL site can highlight the Innovation Project, Robot Design & Code, and Core Values — plus outreach in your community.",
  seasonStoryLinkLabel: "See sample outreach stories",
  videosHeroTitle: "Season videos & resources",
  videosHeroDescription:
    "Link your season playlist and official FIRST resources — these are sample links you can replace.",
  quickLinksHeroTitle: "Quick links",
  quickLinksHeroDescription: "Helpful links for families — customize in Admin → Site content.",
  consentHeroDescription: "Sample media consent form — wire to your team roster in Supabase.",
  assignmentsIntro:
    "Sample assignments page for team members. Coaches can create tasks and parents receive overdue reminders.",
  galleryHeroDescription: "Sample approved photos — parents can submit more from the gallery page.",
  galleryEmptyTitle: "No photos yet.",
  galleryEmptyMessage: "Share photos below — a coach approves them before they appear here.",
};

export const DEMO_OUTREACH_STORIES: OutreachStoryRow[] = [
  {
    id: "mentoring-teams",
    sortOrder: 0,
    title: "Mentoring new FLL teams",
    description:
      "Our demo team runs workshops for new FIRST LEGO League teams — pairing experienced students with rookies to design, build, and learn Core Values together.",
    imageKey: "outreachMentoring",
    defaultImageUrl: demoAssets.outreachMentoring,
    defaultImageAlt: "Mentors and youth building LEGO robots together",
  },
  {
    id: "community-festival",
    sortOrder: 1,
    title: "Community festival workshops",
    description:
      "At local festivals we host hands-on STEM tables where families try simple robot builds and learn about joining a team.",
    imageKey: "outreachIndiaFest",
    defaultImageUrl: demoAssets.outreachFestival,
    defaultImageAlt: "Community festival with STEM activity tables",
  },
  {
    id: "steam-expo",
    sortOrder: 2,
    title: "STEAM Expo",
    description:
      "We showcase mission runs and Innovation Project posters at county STEAM events — inviting neighbors to see what FLL is about.",
    imageKey: "outreachSteamExpo",
    defaultImageUrl: demoAssets.outreachSteamExpo,
    defaultImageAlt: "STEAM expo robotics demonstration",
  },
];

export function buildDemoSiteSettings(productionDefaults: SiteSettings): SiteSettings {
  return {
    ...productionDefaults,
    ...DEMO_SITE_SETTINGS_OVERRIDES,
  };
}

export function demoOutreachStories(productionDefaults: OutreachStoryRow[]): OutreachStoryRow[] {
  return DEMO_OUTREACH_STORIES.length ? DEMO_OUTREACH_STORIES : productionDefaults;
}

export function demoSiteImageDefaultUrl(key: string, productionUrl: string): string {
  const map: Record<string, string> = {
    hero: demoAssets.hero,
    teamLogo: demoAssets.teamLogo,
    favicon32: demoAssets.favicon32,
    favicon16: demoAssets.favicon16,
    appleTouchIcon: demoAssets.appleTouchIcon,
    ogImage: demoAssets.ogImage,
    outreachMentoring: demoAssets.outreachMentoring,
    outreachIndiaFest: demoAssets.outreachFestival,
    outreachSteamExpo: demoAssets.outreachSteamExpo,
  };
  return map[key] ?? productionUrl;
}
