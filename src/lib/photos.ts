/** Drop image files into `public/photos/` — see folder README.txt in each subfolder. */
export const photos = {
  logo: "/photos/logo/Logo.png",
  favicon32: "/photos/logo/favicon-32x32.png",
  favicon16: "/photos/logo/favicon-16x16.png",
  appleTouchIcon: "/photos/logo/apple-touch-icon.png",
  ogLogo: "/photos/logo/og-logo.png",
  hero: "/photos/hero/troop-summit.webp",
  og: "/photos/logo/og-logo.png",
  home: {
    eagle: "/photos/The%20Trail%20to%20Eagle/Trail%20to%20eagle.webp",
    adventure: "/photos/Outdoor%20Adventure/Hiking%20backpacking.webp",
    canoe: "/photos/Outdoor%20Adventure/Water%20Sports.webp",
    camping: "/photos/Outdoor%20Adventure/Camping.webp",
    hiking: "/photos/Outdoor%20Adventure/Hiking%20backpacking.webp",
    flag: "/photos/hero/troop-summit.webp",
  },
  outdoorAdventure: {
    camping: "/photos/Outdoor%20Adventure/Camping.webp",
    hiking: "/photos/Outdoor%20Adventure/Hiking%20backpacking.webp",
    waterSports: "/photos/Outdoor%20Adventure/Water%20Sports.webp",
  },
  trailToEagle: "/photos/The%20Trail%20to%20Eagle/Trail%20to%20eagle.webp",
  values: {
    oath: "/photos/values/scout-oath-banner.webp",
    law: "/photos/values/scout-law-banner.webp",
    outdoorCode: "/photos/values/outdoor-code-banner.webp",
  },
  events: {
    meeting: "/photos/events/meeting-banner.webp",
    ceremony: "/photos/events/ceremony-banner.webp",
    campout: "/photos/events/campout-banner.webp",
    deadline: "/photos/events/deadline-banner.webp",
    service: "/photos/events/service-banner.webp",
    default: "/photos/events/default-banner.webp",
  },
  slideshow: [
    "/photos/hero/troop-summit.webp",
    "/photos/Outdoor%20Adventure/Hiking%20backpacking.webp",
    "/photos/Outdoor%20Adventure/Water%20Sports.webp",
    "/photos/Outdoor%20Adventure/Camping.webp",
    "/photos/hero/troop-summit.webp",
  ],
} as const;

const eventTypePhotos: Record<string, string> = {
  Meeting: photos.events.meeting,
  Ceremony: photos.events.ceremony,
  Campout: photos.events.campout,
  Deadline: photos.events.deadline,
  Service: photos.events.service,
  Other: photos.events.default,
};

export function photoForEventType(type: string): string {
  return eventTypePhotos[type] ?? photos.events.default;
}

export const MEETING_MAPS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=1885+Veterans+Park+Dr,+Naples,+FL+34109";
