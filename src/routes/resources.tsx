import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { brandingRouteLoader, routeTeamName } from "@/lib/team-branding";
import { partitionQuickLinks } from "@/lib/resources-links";
import {
  seasonVideosForGroup,
  seasonWatchUrl,
  youtubeThumbnailUrl,
  type SeasonDocument,
  type SeasonVideo,
} from "@/lib/season-from-settings";
import { useSiteSettings } from "@/lib/site-settings-context";
import type { QuickLinkCard } from "@/lib/site-settings";
import {
  BookOpen,
  ClipboardList,
  ExternalLink,
  FileText,
  Globe,
  Images,
  Lightbulb,
  Link2,
  Newspaper,
  Play,
  Trophy,
} from "lucide-react";
import type { ComponentType } from "react";

export const Route = createFileRoute("/resources")({
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

type LinkItem = QuickLinkCard & { icon: ComponentType<{ size?: number }> };

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

function QuickLinkCardView({ item }: { item: LinkItem }) {
  const Icon = item.icon;
  const external = item.href.startsWith("http");
  const inner = (
    <>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest/10 text-forest">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-display text-lg">{item.label}</div>
          {external && <ExternalLink size={13} className="text-muted-foreground" />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
      </div>
    </>
  );
  const className =
    "group flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest";

  if (external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  if (item.href.startsWith("/#")) {
    return (
      <a href={item.href} className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link to={item.href as "/"} className={className}>
      {inner}
    </Link>
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
  } = settings;

  const { programLinks, teamLinks } = partitionQuickLinks(quickLinks);
  const programItems: LinkItem[] = programLinks.map((link) => ({ ...link, icon: iconForLink(link) }));
  const teamItems: LinkItem[] = teamLinks.map((link) => ({ ...link, icon: iconForLink(link) }));

  return (
    <SiteLayout>
      <PageHero title={videosHeroTitle} align="center" description={videosHeroDescription} />

      <section className="pb-6 pt-2">
        <div className="container-page flex flex-wrap items-center justify-center gap-3">
          <a
            href={seasonPlaylistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary gap-2"
          >
            Full season playlist <ExternalLink size={16} />
          </a>
          <a
            href={seasonResourcesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline gap-2"
          >
            All LEGO Education materials <ExternalLink size={16} />
          </a>
        </div>
      </section>

      <section className="border-y border-border/50 bg-sand/40 py-10 md:py-12">
        <div className="container-page">
          <SectionHeading
            title="Season documents"
            description="Official PDFs the team uses every week — notebook, rulebook, missions, rubric, and score sheet."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seasonDocuments.map((doc) => (
              <DocumentTile key={doc.id} doc={doc} />
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
              <SectionHeading title={group.title} description={group.copy} />
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <VideoTile
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

      {programItems.length > 0 && (
        <section className="border-t border-border/50 bg-sand/30 py-10 md:py-12">
          <div className="container-page">
            <SectionHeading
              title="FIRST program links"
              description="Official sites, guides, and materials from FIRST and FIRST LEGO League."
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programItems.map((item) => (
                <QuickLinkCardView key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {teamItems.length > 0 && (
        <section className="py-10 md:py-12">
          <div className="container-page">
            <SectionHeading
              title="On this site"
              description="Team calendar, gallery, and other pages for families."
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teamItems.map((item) => (
                <QuickLinkCardView key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border/50 bg-sand/30 py-8">
        <div className="container-page text-center text-sm text-muted-foreground">
          Current season: <span className="font-medium text-foreground">{seasonName}</span>
        </div>
      </section>
    </SiteLayout>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl text-foreground md:text-4xl">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

function DocumentTile({ doc }: { doc: SeasonDocument }) {
  return (
    <a
      href={doc.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 rounded-[1.25rem] border border-border bg-background p-5 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest">
        <FileText size={22} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl leading-tight text-foreground">{doc.title}</h3>
          <ExternalLink size={14} className="shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{doc.blurb}</p>
      </div>
    </a>
  );
}

function VideoTile({ video, watchUrl }: { video: SeasonVideo; watchUrl: string }) {
  return (
    <a
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-[1.25rem] border border-border/80 bg-background transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
    >
      <div className="relative aspect-video overflow-hidden bg-forest-deep">
        <img
          src={youtubeThumbnailUrl(video.id)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-transparent to-transparent" />
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-cream/95 text-forest shadow-lg transition-transform group-hover:scale-105">
            <Play size={22} className="ml-0.5" fill="currentColor" />
          </span>
        </div>
      </div>
      <div className="px-4 py-4">
        <h3 className="font-display text-xl leading-tight text-foreground">{video.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{video.blurb}</p>
      </div>
    </a>
  );
}
