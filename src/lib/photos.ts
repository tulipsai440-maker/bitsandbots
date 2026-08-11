/** Drop image files into `public/photos/` — see folder README.txt in each subfolder. */
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";

export const photos = {
  logo: "/photos/logo/fll-logo.png",
  favicon32: "/photos/logo/favicon-32x32.png",
  favicon16: "/photos/logo/favicon-16x16.png",
  appleTouchIcon: "/photos/logo/apple-touch-icon.png",
  ogLogo: "/photos/logo/fll-logo.png",
  hero: "",
  og: "/photos/logo/fll-logo.png",
  outdoorAdventure: {
    camping: "/photos/outreach/mentoring-teams.png",
    hiking: "/photos/outreach/steam-expo.png",
    waterSports: "/photos/outreach/india-fest.png",
  },
  trailToEagle: "/photos/outreach/mentoring-teams.png",
  events: {
    meeting: "/photos/outreach/mentoring-teams.png",
    practice: "/photos/outreach/mentoring-teams.png",
    zoom: "/photos/outreach/steam-expo.png",
    deadline: "/photos/outreach/india-fest.png",
    outreach: "/photos/outreach/steam-expo.png",
    competition: "/photos/outreach/mentoring-teams.png",
    default: "/photos/outreach/mentoring-teams.png",
  },
  slideshow: [
    "/photos/outreach/mentoring-teams.png",
    "/photos/outreach/steam-expo.png",
    "/photos/outreach/india-fest.png",
  ],
} as const;

const eventTypePhotos: Record<string, string> = {
  Meeting: photos.events.meeting,
  Practice: photos.events.practice,
  Zoom: photos.events.zoom,
  Deadline: photos.events.deadline,
  Outreach: photos.events.outreach,
  Competition: photos.events.competition,
  Other: photos.events.default,
};

export function photoForEventType(type: string): string {
  return eventTypePhotos[type] ?? photos.events.default;
}

/** @deprecated Prefer useSiteSettings().siteName — bundled default only. */
export const SITE_NAME = DEFAULT_SITE_SETTINGS.siteName;
/** @deprecated Prefer useSiteSettings().siteTagline — bundled default only. */
export const SITE_TAGLINE = DEFAULT_SITE_SETTINGS.siteTagline;
export const FOUNDED_YEAR = DEFAULT_SITE_SETTINGS.foundedYear;

/** Sunday in-person team practice */
export const PRACTICE_TITLE = DEFAULT_SITE_SETTINGS.practiceTitle;
export const PRACTICE_SUMMARY = DEFAULT_SITE_SETTINGS.practiceSummary;
export const PRACTICE_PLACE = DEFAULT_SITE_SETTINGS.practicePlace;
export const PRACTICE_HOUR = 15;
export const PRACTICE_MINUTE = 0;
export const PRACTICE_END_HOUR = 17;

/** Wednesday online Zoom call */
export const ZOOM_TITLE = DEFAULT_SITE_SETTINGS.zoomTitle;
export const ZOOM_SUMMARY = DEFAULT_SITE_SETTINGS.zoomSummary;
export const ZOOM_PLACE = DEFAULT_SITE_SETTINGS.zoomPlace;
export const ZOOM_HOUR = 18;
export const ZOOM_MINUTE = 0;
export const ZOOM_END_HOUR = 18;
export const ZOOM_END_MINUTE = 30;
export const ZOOM_URL = DEFAULT_SITE_SETTINGS.zoomUrl;

export const MEETING_SUMMARY = DEFAULT_SITE_SETTINGS.meetingSummary;
export const MEETING_PLACE = PRACTICE_PLACE;
export const MEETINGS_BLURB = DEFAULT_SITE_SETTINGS.meetingsBlurb;

export const MEETING_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Coaches+Home";