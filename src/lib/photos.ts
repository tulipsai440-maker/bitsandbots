/** Drop image files into `public/photos/` — see folder README.txt in each subfolder. */
export const photos = {
  logo: "/photos/logo/fll-logo.png",
  favicon32: "/photos/logo/favicon-32x32.png",
  favicon16: "/photos/logo/favicon-16x16.png",
  appleTouchIcon: "/photos/logo/apple-touch-icon.png",
  ogLogo: "/photos/site/hero-bits-and-bots.png",
  hero: "/photos/site/hero-bits-and-bots.png",
  og: "/photos/site/hero-bits-and-bots.png",
  outdoorAdventure: {
    camping: "/photos/site/hero-bits-and-bots.png",
    hiking: "/photos/outreach/steam-expo.png",
    waterSports: "/photos/outreach/india-fest.png",
  },
  trailToEagle: "/photos/site/hero-bits-and-bots.png",
  events: {
    meeting: "/photos/site/hero-bits-and-bots.png",
    practice: "/photos/site/hero-bits-and-bots.png",
    zoom: "/photos/site/hero-bits-and-bots.png",
    deadline: "/photos/site/hero-bits-and-bots.png",
    outreach: "/photos/outreach/steam-expo.png",
    competition: "/photos/outreach/mentoring-teams.png",
    default: "/photos/site/hero-bits-and-bots.png",
  },
  slideshow: [
    "/photos/site/hero-bits-and-bots.png",
    "/photos/outreach/steam-expo.png",
    "/photos/outreach/india-fest.png",
    "/photos/outreach/mentoring-teams.png",
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

export const MEETING_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Coaches+Home";

export const SITE_NAME = "Bits & Bots";
/** Header / footer subtitle */
export const SITE_TAGLINE = "Community Robotics Team · Collier County";
export const FOUNDED_YEAR = "2024";

/** Sunday in-person team practice */
export const PRACTICE_TITLE = "Team practice";
export const PRACTICE_SUMMARY = "Sundays · 3:00–5:00 PM";
export const PRACTICE_PLACE = "TBD";
export const PRACTICE_HOUR = 15;
export const PRACTICE_MINUTE = 0;
export const PRACTICE_END_HOUR = 17;

/** Wednesday online Zoom call */
export const ZOOM_TITLE = "Zoom call";
export const ZOOM_SUMMARY = "Wednesdays · 6:00–6:30 PM";
export const ZOOM_PLACE = "Online · Zoom";
export const ZOOM_HOUR = 18;
export const ZOOM_MINUTE = 0;
export const ZOOM_END_HOUR = 18;
export const ZOOM_END_MINUTE = 30;
/** Set when a real Zoom link is available. */
export const ZOOM_URL: string | null = null;

/** Combined short labels for footers / hero stats */
export const MEETING_SUMMARY = "Sundays 3–5 · Wednesdays Zoom 6–6:30";
export const MEETING_PLACE = PRACTICE_PLACE;
export const MEETINGS_BLURB =
  "Team practice Sundays 3:00–5:00 PM (location TBD), plus a Wednesday Zoom call 6:00–6:30 PM.";
