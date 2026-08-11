import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { brandingRouteLoader, routeTeamName } from "@/lib/team-branding";
import {
  seasonVideosForGroup,
  seasonWatchUrl,
  youtubeThumbnailUrl,
  type SeasonDocument,
  type SeasonVideo,
} from "@/lib/season-from-settings";
import { useSiteSettings } from "@/lib/site-settings-context";
import { ExternalLink, FileText, Play } from "lucide-react";

export const Route = createFileRoute("/videos")({
  loader: brandingRouteLoader,
  head: ({ loaderData }) => {
    const name = routeTeamName(loaderData);
    return {
      meta: [
        { title: `Season Videos & Resources — ${name}` },
        {
          name: "description",
          content: `Official FIRST LEGO League season videos and PDFs for ${name}.`,
        },
        { property: "og:title", content: `${name} — Season Videos & Resources` },
        {
          property: "og:description",
          content: "Season videos plus official team PDFs and resources.",
        },
      ],
    };
  },
  component: VideosPage,
});

function VideosPage() {
  const settings = useSiteSettings();
  const {
    seasonName,
    seasonPlaylistUrl,
    seasonResourcesUrl,
    seasonDocuments,
    seasonVideoGroups,
    videosHeroTitle,
    videosHeroDescription,
  } = settings;

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
            Open full playlist <ExternalLink size={16} />
          </a>
          <a
            href={seasonResourcesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline gap-2"
          >
            All season materials <ExternalLink size={16} />
          </a>
        </div>
      </section>

      <section className="border-y border-border/50 bg-sand/40 py-10 md:py-12">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl text-foreground md:text-4xl">Season documents</h2>
            <p className="mt-2 text-muted-foreground">
              Download the official PDFs the team uses every week.
            </p>
          </div>
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
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl text-foreground md:text-4xl">{group.title}</h2>
                <p className="mt-2 text-muted-foreground">{group.copy}</p>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <VideoTile key={video.id} video={video} watchUrl={seasonWatchUrl(settings, video.id)} />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="border-t border-border/50 bg-sand/30 py-8">
        <div className="container-page text-center text-sm text-muted-foreground">
          Current season: <span className="font-medium text-foreground">{seasonName}</span>
        </div>
      </section>
    </SiteLayout>
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
