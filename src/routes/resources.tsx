import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { EditablePageHero } from "@/components/admin/inline-edit/EditablePageHero";
import { ManageInAdmin } from "@/components/admin/inline-edit/AdminLiveEditBar";
import {
  EditableDocumentTile,
  EditableQuickLinkCard,
  EditableResourcesButton,
  EditableResourcesSectionHeading,
  EditableSeasonName,
  EditableSeasonVideoGroupHeading,
  EditableVideoTile,
} from "@/components/admin/inline-edit/EditableResourcesContent";
import { brandingRouteLoader, routeTeamName } from "@/lib/team-branding";
import { partitionQuickLinks } from "@/lib/resources-links";
import { seasonVideosForGroup, seasonWatchUrl } from "@/lib/season-from-settings";
import { useSiteSettings } from "@/lib/site-settings-context";
import type { QuickLinkCard } from "@/lib/site-settings";
import { parseAdminEditSearch } from "@/lib/admin-route-search";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Globe,
  Images,
  Lightbulb,
  Link2,
  Newspaper,
  Play,
  Trophy,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export const Route = createFileRoute("/resources")({
  validateSearch: parseAdminEditSearch,
  loader: brandingRouteLoader,
  head: ({ loaderData }) => {
    const name = routeTeamName(loaderData);
    return {
      meta: [
        { title: `Resources — ${name}` },
        {
          name: "description",
          content: `Official FIRST LEGO League season videos, PDFs, and helpful links for ${name} families.`,
        },
        { property: "og:title", content: `${name} — Resources` },
        {
          property: "og:description",
          content: "Season videos, official PDFs, and FLL program links in one place.",
        },
      ],
    };
  },
  component: ResourcesPage,
});

function iconForLink(link: QuickLinkCard): ComponentType<{ size?: number }> {
  if (link.href.includes("youtube")) return Play;
  if (link.href.includes("lego.com") || link.href.includes("education")) return BookOpen;
  if (link.href.endsWith(".pdf")) return FileText;
  if (link.href.includes("firstlegoleague")) return Trophy;
  if (link.href.includes("firstinspires.org/robotics/fll/core-values")) return BookOpen;
  if (link.href.includes("firstinspires.org/robotics/fll")) return Lightbulb;
  if (link.href.includes("resource-library")) return ClipboardList;
  if (link.href === "/calendar") return Newspaper;
  if (link.href === "/gallery") return Images;
  if (link.href.includes("firstinspires.org")) return Globe;
  return Link2;
}

function linkIcon(link: QuickLinkCard): ReactNode {
  const Icon = iconForLink(link);
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest/10 text-forest">
      <Icon size={20} />
    </div>
  );
}

function ResourcesPage() {
  const settings = useSiteSettings();
  const {
    seasonName,
    seasonPlaylistUrl,
    seasonResourcesUrl,
    seasonDocuments,
    seasonVideoGroups,
    videosHeroTitle,
    videosHeroDescription,
    quickLinks,
    resourcesPageSections,
  } = settings;

  const { programLinks, teamLinks } = partitionQuickLinks(quickLinks);

  return (
    <SiteLayout>
      <EditablePageHero
        title={videosHeroTitle}
        titleKey="videosHeroTitle"
        titleLabel="Resources page title"
        align="center"
        description={videosHeroDescription}
        descriptionKey="videosHeroDescription"
        descriptionLabel="Resources page intro"
      />

      <section className="pb-6 pt-2">
        <div className="container-page flex flex-wrap items-center justify-center gap-3">
          <EditableResourcesButton
            label={resourcesPageSections.playlistButtonLabel}
            field="playlistButtonLabel"
            href={seasonPlaylistUrl}
            className="btn-primary gap-2"
          />
          <EditableResourcesButton
            label={resourcesPageSections.materialsButtonLabel}
            field="materialsButtonLabel"
            href={seasonResourcesUrl}
            className="btn-outline gap-2"
          />
          <ManageInAdmin label="Edit season links" to="/admin/site-settings" />
        </div>
      </section>

      <section className="border-y border-border/50 bg-sand/40 py-10 md:py-12">
        <div className="container-page">
          <EditableResourcesSectionHeading
            title={resourcesPageSections.documentsTitle}
            description={resourcesPageSections.documentsDescription}
            titleField="documentsTitle"
            descriptionField="documentsDescription"
            sectionLabel="Season documents"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seasonDocuments.map((doc) => (
              <EditableDocumentTile key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      </section>

      {seasonVideoGroups.map((group) => {
        const videos = seasonVideosForGroup(settings, group.key);
        if (!videos.length) return null;
        return (
          <section key={group.key} className="py-10 md:py-12">
            <div className="container-page">
              <EditableSeasonVideoGroupHeading group={group} />
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <EditableVideoTile
                    key={video.id}
                    video={video}
                    watchUrl={seasonWatchUrl(settings, video.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {programLinks.length > 0 && (
        <section className="border-t border-border/50 bg-sand/30 py-10 md:py-12">
          <div className="container-page">
            <EditableResourcesSectionHeading
              title={resourcesPageSections.programTitle}
              description={resourcesPageSections.programDescription}
              titleField="programTitle"
              descriptionField="programDescription"
              sectionLabel="FIRST program links"
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programLinks.map((link) => (
                <EditableQuickLinkCard key={link.id} link={link} icon={linkIcon(link)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {teamLinks.length > 0 && (
        <section className="py-10 md:py-12">
          <div className="container-page">
            <EditableResourcesSectionHeading
              title={resourcesPageSections.teamTitle}
              description={resourcesPageSections.teamDescription}
              titleField="teamTitle"
              descriptionField="teamDescription"
              sectionLabel="On this site"
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teamLinks.map((link) => (
                <EditableQuickLinkCard key={link.id} link={link} icon={linkIcon(link)} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border/50 bg-sand/30 py-8">
        <div className="container-page text-center text-sm text-muted-foreground">
          Current season: <EditableSeasonName seasonName={seasonName} />
        </div>
      </section>
    </SiteLayout>
  );
}
