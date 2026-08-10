import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { TeamPhoto } from "@/components/site/TeamPhoto";
import {
  FOUNDED_YEAR,
  MEETINGS_BLURB,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/photos";
import { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { fetchUpcomingEvents, type EventRow } from "@/lib/events";
import { formatMeetingDate } from "@/lib/meeting";
import {
  buildDefaultSiteImageOverrides,
  fetchSiteImageOverrides,
  resolveSiteImage,
  type SiteImageOverride,
  type SiteImageOverrides,
} from "@/lib/site-images";
import { OUTREACH_ITEMS } from "@/lib/outreach";

async function loadSiteImages(): Promise<SiteImageOverrides> {
  try {
    return await fetchSiteImageOverrides();
  } catch {
    return buildDefaultSiteImageOverrides();
  }
}

export const Route = createFileRoute("/")({
  loader: async () => ({
    siteImages: await loadSiteImages(),
  }),
  head: ({ loaderData }) => {
    const siteImages = loaderData?.siteImages ?? buildDefaultSiteImageOverrides();
    const hero = resolveSiteImage("hero", siteImages);
    const links =
      hero.isOverride && hero.url ? [{ rel: "preload" as const, as: "image" as const, href: hero.url }] : [];
    return {
      meta: [
        { title: `${SITE_NAME} — ${SITE_TAGLINE}` },
        {
          name: "description",
          content: `${SITE_NAME} is a FIRST LEGO League team founded in ${FOUNDED_YEAR}. ${MEETINGS_BLURB}`,
        },
        ...(hero.url ? [{ property: "og:image", content: hero.url }] : []),
      ],
      links,
    };
  },
  component: HomePage,
});

function HomePage() {
  const { siteImages } = Route.useLoaderData();
  const hero = resolveSiteImage("hero", siteImages);

  return (
    <SiteLayout>
      <Hero hero={hero} />
      <NextUpStrip />
      <SeasonStory siteImages={siteImages} />
      <WhatWeDo />
      <CTA />
    </SiteLayout>
  );
}

function Hero({ hero }: { hero: SiteImageOverride }) {
  return (
    <section className="relative isolate overflow-hidden bg-forest-deep">
      {hero.isOverride && hero.url ? (
        <TeamPhoto
          src={hero.url}
          alt={hero.alt || `${SITE_NAME} FIRST LEGO League team`}
          width={1024}
          height={453}
          loading="eager"
          fetchPriority="high"
          className="animate-hero-media absolute inset-0 h-[118%] w-full object-cover object-[center_5%] translate-y-0"
          label="Hero"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/35 via-transparent via-35% to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-deep from-0% via-forest-deep/88 via-40% to-transparent to-72%" />
      <div className="relative">
        <div className="container-page flex min-h-[78vh] flex-col items-center justify-end pb-14 pt-24 text-center text-cream md:min-h-[86vh] md:pb-20">
          <div className="animate-rise max-w-3xl">
            <h1 className="font-display text-6xl leading-[0.95] tracking-tight text-cream md:text-8xl">
              {SITE_NAME}
            </h1>
            <p className="mt-4 font-display text-xl text-cream/90 md:text-2xl">{SITE_TAGLINE}</p>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-cream/80 md:text-lg">
              We research the season challenge, build robots that score on the table, and practice
              Core Values every Sunday—then take that energy into outreach.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/about" className="btn-primary">
                Meet the team <ArrowRight size={16} />
              </Link>
              <Link to="/videos" className="btn-outline !border-cream/40 !text-cream hover:!bg-cream/10">
                Watch BIOGLOW videos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatEventTimeRange(event: EventRow): string {
  const start = new Date(event.starts_at);
  const startLabel = start.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  if (!event.ends_at) return startLabel;
  const end = new Date(event.ends_at);
  const endLabel = end.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${startLabel}–${endLabel}`;
}

function NextUpStrip() {
  const [event, setEvent] = useState<EventRow | null>(null);

  useEffect(() => {
    fetchUpcomingEvents(1)
      .then((rows) => setEvent(rows[0] ?? null))
      .catch(() => setEvent(null));
  }, []);

  if (!event) return null;

  return (
    <section className="animate-rise border-b border-border/60 bg-background">
      <div className="container-page flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest text-cream">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Next: {event.title}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {formatMeetingDate(new Date(event.starts_at))} · {formatEventTimeRange(event)}
              {event.location ? ` · ${event.location}` : ""}
            </div>
          </div>
        </div>

        <Link to="/calendar" className="text-sm font-medium text-forest hover:underline sm:shrink-0">
          Full calendar →
        </Link>
      </div>
    </section>
  );
}

function SeasonStory({ siteImages }: { siteImages: SiteImageOverrides }) {
  const feature = OUTREACH_ITEMS[0];
  const photo = resolveSiteImage("outreachMentoring", siteImages);

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.74_0.13_82_/_0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.38_0.09_145_/_0.08),transparent_50%)]" />
      <div className="container-page relative grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="animate-rise order-2 md:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest">This season</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] text-foreground md:text-5xl">
            Built for the challenge—shared beyond the table
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Bits &amp; Bots is a FIRST LEGO League Challenge team. We split practice between the
            Innovation Project, Robot Design &amp; Code, and Core Values—then mentor newer teams and
            run workshops so more kids can try FLL.
          </p>
          <Link to="/outreach" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-forest hover:underline">
            How we show up in the community <ArrowRight size={16} />
          </Link>
        </div>
        <div className="animate-rise order-1 overflow-hidden rounded-[1.75rem] md:order-2">
          <img
            src={photo.url}
            alt={photo.alt || feature.imageAlt}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}

function WhatWeDo() {
  const pillars = [
    {
      title: "Innovation Project",
      copy: "Dig into the season theme, find a real problem worth solving, and present a solution we’re proud to defend.",
    },
    {
      title: "Robot Design & Code",
      copy: "Design mechanisms, write mission runs, and keep refining until the robot does the job on its own.",
    },
    {
      title: "Core Values",
      copy: "Discovery, Innovation, Impact, Inclusion, Teamwork, and Fun—how we treat each other when the run fails and when it lands.",
      href: "/core-values" as const,
    },
  ];

  return (
    <section className="border-y border-border/50 bg-background py-16 md:py-20">
      <div className="container-page">
        <div className="animate-rise max-w-2xl">
          <h2 className="font-display text-4xl text-foreground md:text-5xl">How FLL Challenge works for us</h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Three parts. One team. Every meeting leans into at least one of them.
          </p>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
          {pillars.map((c, index) => (
            <article
              key={c.title}
              className="animate-rise border-t border-forest/25 pt-6"
              style={{ animationDelay: `${120 + index * 90}ms` }}
            >
              <p className="font-display text-sm text-forest">0{index + 1}</p>
              <h3 className="mt-2 font-display text-2xl md:text-3xl">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{c.copy}</p>
              {"href" in c && c.href ? (
                <Link to={c.href} className="mt-4 inline-block text-sm font-medium text-forest hover:underline">
                  Read our Core Values →
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="pb-16 pt-16 md:pb-24 md:pt-20">
      <div className="container-page">
        <div className="animate-rise relative overflow-hidden rounded-[2rem] bg-forest px-8 py-14 text-cream md:px-14 md:py-16">
          <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-4xl text-cream md:text-5xl">Come to a practice</h2>
            <p className="mt-4 text-cream/85 md:text-lg">
              {MEETINGS_BLURB} Watch a mission run, hear an Innovation idea, or just say hello.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/calendar" className="btn-primary bg-gold !text-forest-deep hover:brightness-110">
                Calendar
              </Link>
              <Link to="/about" className="btn-outline !border-cream/40 !text-cream hover:!bg-cream/10">
                Our Team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
