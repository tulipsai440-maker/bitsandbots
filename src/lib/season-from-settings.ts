import type { SiteSettings } from "@/lib/site-settings";
import { youtubeThumbnailUrl, type SeasonDocument, type SeasonVideo } from "@/lib/season-videos";

export function seasonWatchUrl(settings: SiteSettings, videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}&list=${settings.seasonPlaylistId}`;
}

export function seasonVideosForGroup(settings: SiteSettings, group: SeasonVideo["group"]): SeasonVideo[] {
  return settings.seasonVideos.filter((video) => video.group === group);
}

export { youtubeThumbnailUrl, type SeasonDocument, type SeasonVideo };
