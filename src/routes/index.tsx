import { createFileRoute, Link } from "@tanstack/react-router";
import { SettingsNavLink } from "@/components/site/SettingsNavLink";
import { SiteLayout } from "@/components/site/Layout";
import { EditableBlock, EditableText } from "@/components/admin/inline-edit/EditableText";
import { EditableHeroTextColor } from "@/components/admin/inline-edit/EditableHeroTextColor";
import { ManageInAdmin } from "@/components/admin/inline-edit/AdminLiveEditBar";
import { EditableHomepagePillar } from "@/components/admin/inline-edit/EditableHomepagePillar";
import { TeamPhoto } from "@/components/site/TeamPhoto";
import { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { fetchUpcomingEvents, type EventRow } from "@/lib/events";
import { formatMeetingDate } from "@/lib/meeting";
import {
  buildDefaultSiteImageOverrides,
  fetchSiteImageOverrides,
  resolveSiteImage,
  SITE_IMAGE_SLOTS,
  type SiteImageOverride,
  type SiteImageOverrides,
} from "@/lib/site-images";
import { OUTREACH_ITEMS } from "@/lib/outreach";
import { useSiteSettings } from "@/lib/site-settings-context";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";
import { brandingRouteLoader, defaultTeamBranding } from "@/lib/team-branding";
import { shouldUseDemoAssets } from "@/lib/demo/demo-tenant";
import { parseAdminEditSearch } from "@/lib/admin-route-search";
import { hexWithAlpha, normalizeHeroTextColor } from "@/lib/brand-colors";

async function loadSiteImages(): Promise<SiteImageOverrides> {
  try {
    return await fetchSiteImageOverrides();
  } catch {
    return buildDefaultSiteImageOverrides();
  }
}

export const Route = createFileRoute("/")({
  validateSearch: parseAdminEditSearch,
  loader: async () => {
    try {
      return {
        siteImages: await loadSiteImages(),
        isDemo: await shouldUseDemoAssets(),
        ...(await brandingRouteLoader()),
      };
    } catch (error) {
      console.error("[home loader]", error);
      return {
        siteImages: buildDefaultSiteImageOverrides(),
        isDemo: false,
        branding: defaultTeamBranding(),
      };
    }
  },
  head: ({ loaderData }) => {
    const siteImages = loaderData?.siteImages ?? buildDefaultSiteImageOverrides();
    const hero = resolveSiteImage("hero", siteImages);
    const heroDefault = SITE_IMAGE_SLOTS.find((slot) => slot.key === "hero")!;
    const heroUrl = hero.url || heroDefault.defaultUrl;
    const s = loaderData?.branding
      ? {
          ...DEFAULT_SITE_SETTINGS,
          siteName: loaderData.branding.siteName,
          siteTagline: loaderData.branding.siteTagline,
          siteUrl: loaderData.branding.siteUrl,
        }
      : DEFAULT_SITE_SETTINGS;
    const links =
      heroUrl ? [{ rel: "preload" as const, as: "image" as const, href: heroUrl }] : [];
    return {
      meta: [
        { title: `${s.siteName} — ${s.siteTagline}` },
        {
          name: "description",
          content: `${s.siteName} — ${s.siteTagline}`,
        },
        ...(heroUrl ? [{ property: "og:image", content: heroUrl }] : []),
      ],
      links,
    };
  },
  component: HomePage,
});

function HomePage() {
  const { siteImages, isDemo } = Route.useLoaderData();
  const hero = resolveSiteImage("hero", siteImages);

  return (
    <SiteLayout>
      <Hero hero={hero} isDemo={isDemo} />
      <NextUpStrip />
      <SeasonStory siteImages={siteImages} />
      <WhatWeDo />
      <CTA />
    </SiteLayout>
  );
}

function Hero({ hero }: { hero: SiteImageOverride; isDemo?: boolean }) {
  const heroDefault = SITE_IMAGE_SLOTS.find((slot) => slot.key === "hero")!;
  const {
    siteName,
    siteTagline,
    heroSubtext,
    heroTextColor,
    heroPrimaryLabel,
    heroPrimaryPath,
    heroSecondaryLabel,
    heroSecondaryPath,
  } = useSiteSettings();
  const heroUrl = hero.url || heroDefault.defaultUrl;
  const textColor = normalizeHeroTextColor(heroTextColor);
  const taglineColor = hexWithAlpha(textColor, 0.92);
  const subtextColor = hexWithAlpha(textColor, 0.82);
  return (
    <section className="relative isolate overflow-hidden bg-forest-deep">
      <EditableHeroTextColor />
      {heroUrl ? (
        <TeamPhoto
          src={heroUrl}
          fallbackSrc={hero.isOverride ? heroDefault.defaultUrl : undefined}
          alt={hero.alt || `${siteName} team`}
          width={1024}
          height={453}
          loading="eager"
          fetchPriority="high"
          className="animate-hero-media absolute inset-0 h-[118%] w-full object-cover object-[center_5%] translate-y-0"
          label="Hero"
        />
      ) : null}
      {/* Soft overlay so hero copy stays readable on bright or busy photos (live + demo). */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/25 via-transparent via-40% to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-deep from-0% via-forest-deep/85 via-42% to-transparent to-74%" />
      <div className="relative">
        <div
          className="container-page flex min-h-[78vh] flex-col items-center justify-end pb-14 pt-24 text-center md:min-h-[86vh] md:pb-20"
          style={{ color: textColor }}
        >
          <div className="animate-rise max-w-3xl">
            <h1
              className="font-display text-6xl leading-[0.95] tracking-tight md:text-8xl"
              style={{ color: textColor }}
            >
              <EditableText settingKey="siteName" label="Team name" heroText>
                {siteName}
              </EditableText>
            </h1>
            <p
              className="mt-4 font-display text-xl md:text-2xl"
              style={{ color: taglineColor }}
            >
              <EditableText settingKey="siteTagline" label="Tagline" heroText>
                {siteTagline}
              </EditableText>
            </p>
            <EditableBlock settingKey="heroSubtext" label="Hero subtext" className="mx-auto mt-5 max-w-lg" heroText>
              <p className="text-base leading-relaxed md:text-lg" style={{ color: subtextColor }}>
                {heroSubtext}
              </p>
            </EditableBlock>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <SettingsNavLink path={heroPrimaryPath} className="btn-primary">
                {heroPrimaryLabel} <ArrowRight size={16} />
              </SettingsNavLink>
              <SettingsNavLink
                path={heroSecondaryPath}
                className="btn-outline !border-cream/40 !text-cream hover:!bg-cream/10"
              >
                {heroSecondaryLabel}
              </SettingsNavLink>
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
        <ManageInAdmin label="Manage calendar" to="/calendar" />
      </div>
    </section>
  );
}

function SeasonStory({ siteImages }: { siteImages: SiteImageOverrides }) {
  const {
    seasonEyebrow,
    seasonStoryTitle,
    seasonStoryBody,
    seasonStoryLinkLabel,
  } = useSiteSettings();
  const feature = OUTREACH_ITEMS[0];
  const photo = resolveSiteImage("outreachMentoring", siteImages);

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.74_0.13_82_/_0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.38_0.09_145_/_0.08),transparent_50%)]" />
      <div className="container-page relative grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="animate-rise order-2 md:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest">
            <EditableText settingKey="seasonEyebrow" label="Season eyebrow">
              {seasonEyebrow}
            </EditableText>
          </p>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] text-foreground md:text-5xl">
            <EditableText settingKey="seasonStoryTitle" label="Season story title">
              {seasonStoryTitle}
            </EditableText>
          </h2>
          <EditableBlock settingKey="seasonStoryBody" label="Season story body" className="mt-5">
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{seasonStoryBody}</p>
          </EditableBlock>
          <Link to="/outreach" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-forest hover:underline">
            <EditableText settingKey="seasonStoryLinkLabel" label="Season story link label">
              {seasonStoryLinkLabel}
            </EditableText>{" "}
            <ArrowRight size={16} />
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
  const { whatWeDoTitle, whatWeDoSubtitle, homepagePillars } = useSiteSettings();

  return (
    <section className="border-y border-border/50 bg-background py-16 md:py-20">
      <div className="container-page">
        <div className="animate-rise max-w-2xl">
          <h2 className="font-display text-4xl text-foreground md:text-5xl">
            <EditableText settingKey="whatWeDoTitle" label="What we do title">
              {whatWeDoTitle}
            </EditableText>
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            <EditableText settingKey="whatWeDoSubtitle" label="What we do subtitle" multiline>
              {whatWeDoSubtitle}
            </EditableText>
          </p>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
          {homepagePillars.map((pillar, index) => (
            <EditableHomepagePillar key={`${pillar.title}-${index}`} pillar={pillar} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { ctaTitle, ctaBody, ctaPrimaryLabel, ctaPrimaryPath, ctaSecondaryLabel, ctaSecondaryPath } =
    useSiteSettings();
  return (
    <section className="pb-16 pt-16 md:pb-24 md:pt-20">
      <div className="container-page">
        <div className="animate-rise relative overflow-hidden rounded-[2rem] bg-forest px-8 py-14 text-cream md:px-14 md:py-16">
          <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-4xl text-cream md:text-5xl">
              <EditableText settingKey="ctaTitle" label="CTA title">
                {ctaTitle}
              </EditableText>
            </h2>
            <EditableBlock settingKey="ctaBody" label="CTA body" className="mt-4">
              <p className="text-cream/85 md:text-lg">{ctaBody}</p>
            </EditableBlock>
            <div className="mt-8 flex flex-wrap gap-3">
              <SettingsNavLink path={ctaPrimaryPath} className="btn-primary bg-gold !text-forest-deep hover:brightness-110">
                {ctaPrimaryLabel}
              </SettingsNavLink>
              <SettingsNavLink path={ctaSecondaryPath} className="btn-outline !border-cream/40 !text-cream hover:!bg-cream/10">
                {ctaSecondaryLabel}
              </SettingsNavLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
