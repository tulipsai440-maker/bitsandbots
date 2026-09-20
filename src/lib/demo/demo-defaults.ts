import { demoSiteName, demoSiteOrigin } from "@/lib/demo/app-mode";
import { demoAssets } from "@/lib/demo/demo-assets";
import type { OutreachStoryRow, SiteSettings } from "@/lib/site-settings";

/** Partial overrides applied when VITE_DEMO_MODE=true. Prefer natural team copy over instructional placeholders. */
export const DEMO_SITE_SETTINGS_OVERRIDES: Partial<SiteSettings> = {
  siteName: demoSiteName,
  siteTagline: "First Tech Challenge Team in Collier County",
  siteUrl: demoSiteOrigin,
  foundedYear: "2025",
  aboutBlurb:
    "We are a community robotics team from Collier County, Florida, competing in First Tech Challenge. Each season we design and program robots, prepare for competitions, and practice Core Values like discovery, innovation, impact, inclusion, teamwork, and fun.",
  aboutHeroDescription:
    "Bots4Life is a First Tech Challenge team founded in 2025. Team practice Saturdays 10:00 AM–12:00 PM in Naples.",
  coachesHeroDescription:
    "The coaches who guide Bots4Life through design, coding, Core Values, and competition season.",
  sponsorsHeroDescription:
    "Community partners help Bots4Life build, compete, and share First Tech Challenge with others.",
  outreachHeroDescription:
    "Bots4Life shares robotics beyond our own meetings—mentoring new teams and hosting workshops at community events.",
  heroSubtext:
    "We design robots, write code, and practice Core Values every week—then take that energy into outreach and competition.",
  seasonStoryTitle: "Built for the challenge—shared beyond the table",
  seasonStoryBody:
    "Bots4Life is a First Tech Challenge team. We split practice between robot design, coding, strategy, and Core Values—then mentor newer teams and run workshops so more kids can try robotics.",
  seasonStoryLinkLabel: "How we show up in the community",
  whatWeDoTitle: "How First Tech Challenge works for us",
  videosHeroTitle: "Resources",
  videosHeroDescription:
    "Official season videos and PDFs, plus FIRST Tech Challenge links — everything in one place.",
  quickLinksHeroTitle: "Quick links",
  quickLinksHeroDescription:
    "Official season videos and PDFs, plus FIRST links for Bots4Life families.",
  consentHeroDescription: "Permission for Bots4Life to share team photos and videos.",
  // Kids use the page directly, not the menu — /assignments stays reachable by URL.
  showAssignmentsNav: false,
  showCoreValuesNav: false,
  assignmentsIntro:
    "This page is for Bots4Life team members only. On your first visit, choose your name and create a private 4-digit PIN. After that, enter your PIN each time you sign in to view and update your tasks. If you forget your PIN, ask a coach — they can reset it so you can set a new one.",
  galleryHeroDescription: "Approved photos from practices, builds, and team events.",
  galleryEmptyTitle: "No photos yet.",
  galleryEmptyMessage: "Share photos below — a coach approves them before they appear here.",
  // Team meets in person only — no midweek Zoom call.
  showZoomMeeting: false,
  meetingsBlurb: "Team practice Saturdays 10:00 AM–12:00 PM in Naples.",
  meetingSummary: "Saturdays 10–12",
  practiceSummary: "Saturdays · 10:00 AM–12:00 PM",
  practicePlace: "Naples, FL",
  ctaTitle: "Come to a practice",
  ctaBody:
    "Team practice Saturdays 10:00 AM–12:00 PM in Naples. Watch a robot run, meet the team, or just say hello.",
  joinHeroDescription:
    "Send a short message and a coach will follow up. You can also visit a Saturday team practice.",
  coreValuesIntro:
    "The FIRST Core Values guide how Bots4Life learns, competes, and works with others. Official definitions below are from FIRST.",
  eventsHeroDescription: "Team practice on Saturdays.",
  calendarHeroDescription: "Practices and team events.",
  footerExternalLinks: [
    {
      kind: "external",
      label: "FIRST Tech Challenge",
      href: "https://www.firstinspires.org/robotics/ftc",
    },
    {
      kind: "external",
      label: "FIRST Inspires",
      href: "https://www.firstinspires.org/",
    },
    { kind: "internal", label: "Resources", to: "/resources" },
  ],
};

export const DEMO_OUTREACH_STORIES: OutreachStoryRow[] = [
  {
    id: "mentoring-teams",
    sortOrder: 0,
    title: "Mentoring new teams",
    description:
      "Our team runs workshops for new robotics teams — pairing experienced students with rookies to design, build, and learn Core Values together.",
    imageKey: "outreachMentoring",
    defaultImageUrl: demoAssets.outreachMentoring,
    defaultImageAlt: "Mentors and youth building robots together",
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
      "We showcase robot demos and team projects at county STEAM events — inviting neighbors to see what youth robotics is about.",
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
