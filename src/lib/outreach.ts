import {
  buildDefaultSiteImageOverrides,
  fetchSiteImageOverrides,
  resolveSiteImage,
  type SiteImageKey,
} from "@/lib/site-images";

export type OutreachItem = {
  id: string;
  title: string;
  description: string;
  imageKey: SiteImageKey;
  imageUrl: string;
  imageAlt: string;
};

const OUTREACH_BASE = [
  {
    id: "mentoring-teams",
    imageKey: "outreachMentoring" as const,
    title: "Mentoring new FLL teams",
    description:
      "Bits & Bots has mentored and helped found two new FIRST LEGO League teams. We share meeting routines, robot-game basics, and Core Values practices so new coaches and students can start their season with confidence.",
    imageUrl: "/photos/outreach/mentoring-teams.png",
    imageAlt: "Mentors and youth building LEGO robots together",
  },
  {
    id: "india-fest",
    imageKey: "outreachIndiaFest" as const,
    title: "India Fest workshops",
    description:
      "At community celebrations such as India Fest, our team runs hands-on workshops where visitors can try simple builds, learn about FIRST LEGO League, and see how robotics connects creativity, coding, and teamwork.",
    imageUrl: "/photos/outreach/india-fest.png",
    imageAlt: "Community festival with STEM activity tables",
  },
  {
    id: "steam-expo",
    imageKey: "outreachSteamExpo" as const,
    title: "STEAM Expo at Collier County",
    description:
      "We host workshops at STEAM Expo events in Collier County, inviting families to explore robotics stations, ask questions about FIRST LEGO League, and discover how youth can learn STEM through friendly competition and collaboration.",
    imageUrl: "/photos/outreach/steam-expo.png",
    imageAlt: "STEAM expo with robotics and science stations",
  },
];

/** Static defaults (used before / if Supabase site images are unavailable). */
export const OUTREACH_ITEMS: OutreachItem[] = OUTREACH_BASE.map((item) => ({ ...item }));

/** Resolve outreach stories with Admin → Site Images overrides when available. */
export async function fetchOutreachItems(): Promise<OutreachItem[]> {
  try {
    const overrides = await fetchSiteImageOverrides();
    return OUTREACH_BASE.map((item) => {
      const image = resolveSiteImage(item.imageKey, overrides);
      return {
        ...item,
        imageUrl: image.url,
        imageAlt: image.alt || item.imageAlt,
      };
    });
  } catch {
    return OUTREACH_ITEMS;
  }
}

export function outreachItemsFromDefaults(): OutreachItem[] {
  const overrides = buildDefaultSiteImageOverrides();
  return OUTREACH_BASE.map((item) => {
    const image = resolveSiteImage(item.imageKey, overrides);
    return { ...item, imageUrl: image.url, imageAlt: image.alt || item.imageAlt };
  });
}
