import { BIOGLOW_DOCUMENTS } from "@/lib/season-videos";
import type { QuickLinkCard } from "@/lib/site-settings";

const SKIP_QUICK_LINK_IDS = new Set([
  "season-videos",
  "season-resources",
  "season-playlist",
  ...BIOGLOW_DOCUMENTS.map((doc) => doc.id),
]);

/** Quick links shown below season videos — excludes PDFs and playlist duplicates. */
export function filterSupplementaryQuickLinks(links: QuickLinkCard[]): QuickLinkCard[] {
  return links.filter(
    (link) =>
      !SKIP_QUICK_LINK_IDS.has(link.id) &&
      link.href !== "/videos" &&
      link.href !== "/resources" &&
      link.href !== "/quick-links",
  );
}

export function partitionQuickLinks(links: QuickLinkCard[]): {
  programLinks: QuickLinkCard[];
  teamLinks: QuickLinkCard[];
} {
  const filtered = filterSupplementaryQuickLinks(links);
  const teamLinks = filtered.filter((link) => link.href.startsWith("/") && !link.href.startsWith("//"));
  const programLinks = filtered.filter((link) => !link.href.startsWith("/") || link.href.startsWith("//"));
  return { programLinks, teamLinks };
}
