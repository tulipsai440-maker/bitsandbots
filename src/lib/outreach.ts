import {
  buildDefaultSiteImageOverrides,
  fetchSiteImageOverrides,
  resolveSiteImage,
  type SiteImageKey,
} from "@/lib/site-images";
import {
  DEFAULT_OUTREACH_STORIES,
  fetchOutreachStories,
  type OutreachStoryRow,
} from "@/lib/site-settings";

export type OutreachItem = {
  id: string;
  title: string;
  description: string;
  imageKey: SiteImageKey;
  imageUrl: string;
  imageAlt: string;
};

function toOutreachItem(
  story: OutreachStoryRow,
  overrides: ReturnType<typeof buildDefaultSiteImageOverrides>,
): OutreachItem {
  const imageKey = story.imageKey as SiteImageKey;
  const image = resolveSiteImage(imageKey, overrides);
  return {
    id: story.id,
    title: story.title,
    description: story.description,
    imageKey,
    imageUrl: image.isOverride ? image.url : story.defaultImageUrl || image.url,
    imageAlt: image.alt || story.defaultImageAlt,
  };
}

/** Static defaults (used before / if Supabase is unavailable). */
export const OUTREACH_ITEMS: OutreachItem[] = DEFAULT_OUTREACH_STORIES.map((story) => ({
  id: story.id,
  title: story.title,
  description: story.description,
  imageKey: story.imageKey as SiteImageKey,
  imageUrl: story.defaultImageUrl,
  imageAlt: story.defaultImageAlt,
}));

/** Resolve outreach stories from DB + Admin → Site Images overrides when available. */
export async function fetchOutreachItems(): Promise<OutreachItem[]> {
  try {
    const [stories, overrides] = await Promise.all([
      fetchOutreachStories(),
      fetchSiteImageOverrides(),
    ]);
    return stories.map((story) => toOutreachItem(story, overrides));
  } catch {
    return OUTREACH_ITEMS;
  }
}

export function outreachItemsFromDefaults(): OutreachItem[] {
  const overrides = buildDefaultSiteImageOverrides();
  return DEFAULT_OUTREACH_STORIES.map((story) => toOutreachItem(story, overrides));
}
