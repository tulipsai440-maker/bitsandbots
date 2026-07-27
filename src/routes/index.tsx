import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { TroopPhoto } from "@/components/site/TroopPhoto";
import { photos } from "@/lib/photos";
import { ArrowRight, Calendar, ChevronRight, Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchUpcomingEvents, type EventRow } from "@/lib/events";
import { fetchActiveAnnouncements, type AnnouncementRow } from "@/lib/announcements";
import {
  fetchApprovedEagleScoutCount,
  fetchApprovedEagleScouts,
  rankEagleScouts,
  type EagleScoutRow,
} from "@/lib/content";
import { fetchApprovedGalleryPhotos, type ApprovedGalleryPhoto } from "@/lib/gallery-uploads";
import { galleryPhotos } from "@/lib/gallery-photos";
import { formatMeetingDate, formatMeetingTime, getNextMeetingDate } from "@/lib/meeting";

type MosaicPhoto = { src: string; alt: string };

function buildMosaicPhotos(uploaded: ApprovedGalleryPhoto[]): MosaicPhoto[] {
  const merged: MosaicPhoto[] = [
    ...uploaded.map((p) => ({ src: p.url, alt: p.caption ?? "Troop 2001 photo" })),
    { src: photos.hero, alt: "Troop 2001 scouts at camp" },
    ...galleryPhotos.map((p) => ({ src: p.src, alt: "Troop 2001 photo" })),
  ];

  const seen = new Set<string>();
  return merged.filter((p) => {
    if (seen.has(p.src)) return false;
    seen.add(p.src);
    return true;
  }).slice(0, 7);
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Troop 2001 Naples — Scouts BSA in Naples, Florida" },
      { name: "description", content: "Troop 2001 meets Wednesdays at 7 PM in Naples, Florida. Campouts, service projects, and Eagle Scout program since 2000." },
      { property: "og:image", content: `https://troop2001naples.org${photos.ogLogo}` },
    ],
  }),
  loader: async () => {
    const [eagleCount, eagles, uploadedPhotos] = await Promise.all([
      fetchApprovedEagleScoutCount(),
      fetchApprovedEagleScouts().catch(() => [] as EagleScoutRow[]),
      fetchApprovedGalleryPhotos().catch(() => [] as ApprovedGalleryPhoto[]),
    ]);

    return {
      eagleCount,
      eagles,
      mosaicPhotos: buildMosaicPhotos(uploadedPhotos),
    };
  },
  component: HomePage,
});

function HomePage() {
  const { eagleCount, eagles, mosaicPhotos } = Route.useLoaderData();

  return (
    <SiteLayout>
      <Hero eagleCount={eagleCount} />
      <NextUpStrip />
      <EaglePreviewWall eagles={eagles} eagleCount={eagleCount} />
      <AdventureSection />
      <EventsAndAnnouncements />
      <PhotoMosaic photos={mosaicPhotos} />
      <QuickLinksPreview />
      <CTA />
    </SiteLayout>
  );
}

function Hero({ eagleCount }: { eagleCount: number | null }) {
  // Retry from the browser when the server-rendered count is unavailable.
  const [count, setCount] = useState(eagleCount);
  useEffect(() => {
    if (count !== null) return;
    fetchApprovedEagleScoutCount().then(setCount);
  }, [count]);

  const showEagleStat = typeof count === "number" && count > 0;

  return (
    <section className="relative isolate overflow-hidden">
      <TroopPhoto
        src={photos.hero}
        alt="Troop 2001 scouts at camp"
        width={1920}
        height={1200}
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
        label="Troop photo"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/75 via-forest-deep/60 to-forest-deep/90" />
      <div className="relative">
        <div className="container-page flex min-h-[86vh] flex-col items-center justify-end pb-16 pt-32 text-center text-cream md:min-h-[92vh] md:pb-24">
          <div className="max-w-3xl">
            <p className="font-display text-lg text-cream/90 md:text-xl">Troop 2001 · Naples, Florida</p>
            <h1 className="mt-3 font-display text-5xl leading-[1.05] text-cream md:text-6xl">
              Scouting here since 2000.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream/85 md:text-lg">
              We meet every Wednesday at 7 PM at North Collier Fire Station #45. Scouts camp frequently,
              serve the community, and work toward Eagle Scout with volunteer leaders who know them by name.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/join" className="btn-primary bg-gold !text-forest-deep hover:!bg-gold hover:brightness-110">
                Join Troop 2001 <ArrowRight size={16} />
              </Link>
              <Link to="/about" className="btn-outline !border-cream/30 !text-cream hover:!bg-cream/10">
                About the troop
              </Link>
            </div>
          </div>

          <div
            className={`mt-16 grid w-full gap-6 border-t border-cream/15 pt-8 text-left sm:grid-cols-2 ${
              showEagleStat ? "max-w-5xl md:grid-cols-4" : "max-w-4xl md:grid-cols-3"
            }`}
          >
            <Stat label="Chartered" value="2000" />
            {showEagleStat && (
              <Link to="/eagle-scouts" className="group">
                <div className="text-sm text-cream/65">Eagle Scouts</div>
                <div className="mt-1 font-display text-2xl text-gold md:text-3xl">
                  {count}
                  <span className="ml-1.5 inline-block text-base text-cream/70 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </div>
              </Link>
            )}
            <Stat label="Weekly meeting" value="Wednesdays · 7:00 PM" />
            <div>
              <div className="flex items-center gap-1.5 text-sm text-cream/65">
                <MapPin size={14} /> Meeting place
              </div>
              <div className="mt-1 font-display text-lg leading-tight text-cream md:text-xl">
                North Collier Fire Station #45<br/>
                <span className="text-base text-cream/85 md:text-lg">1885 Veterans Park Dr, Naples, FL 34109</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-cream/65">{label}</div>
      <div className="mt-1 font-display text-2xl text-cream md:text-3xl">{value}</div>
    </div>
  );
}

function NextUpStrip() {
  const meeting = getNextMeetingDate();

  return (
    <section className="border-b border-border/60 bg-sand">
      <div className="container-page flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest text-cream">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Next meeting</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {formatMeetingDate(meeting)} · {formatMeetingTime()} · North Collier Fire Station #45
            </div>
          </div>
        </div>

        <Link to="/calendar" className="text-sm font-medium text-forest hover:underline sm:shrink-0">
          Campouts and events on the calendar →
        </Link>
      </div>
    </section>
  );
}

function eagleInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function EaglePreviewWall({
  eagles,
  eagleCount,
}: {
  eagles: EagleScoutRow[];
  eagleCount: number | null;
}) {
  const ranked = rankEagleScouts(eagles.filter((e) => e.status === "approved"));
  const preview = ranked.slice(-8).reverse();
  const total = eagleCount ?? ranked.length;

  if (preview.length === 0) {
    return (
      <section className="py-24">
        <div className="container-page grid gap-12 md:grid-cols-2 md:items-center">
          <div className="relative overflow-hidden rounded-2xl">
            <TroopPhoto
              src={photos.trailToEagle}
              alt="Eagle Scout medal on uniform"
              width={1600}
              height={1100}
              className="h-full w-full object-cover"
              label="Eagle Scout"
            />
          </div>
          <div>
            <h2 className="font-display text-4xl text-foreground md:text-5xl">Eagle Scouts</h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Scouts work through ranks with adult mentors who track merit badges, leadership roles,
              and Eagle service projects.
            </p>
            <div className="mt-8">
              <Link to="/eagle-scouts" className="btn-primary">
                Eagle Scout roll <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl text-foreground md:text-5xl">Eagle Scouts</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {total > 0
                ? `${total} Eagle Scout${total === 1 ? "" : "s"} on our roll. Recent awards shown below.`
                : "Recent Eagle Scouts from Troop 2001."}
            </p>
          </div>
          <Link to="/eagle-scouts" className="btn-outline">
            Full roll of honor <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {preview.map((eagle) => (
            <Link
              key={eagle.id}
              to="/eagle-scouts"
              className="group overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-forest/40"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-forest via-forest-deep to-navy font-display text-lg text-cream">
                  {eagleInitials(eagle.name)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground group-hover:text-forest">{eagle.name}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">Eagle · {eagle.year}</div>
                  <div className="mt-1 font-display text-sm tabular-nums text-gold">#{eagle.rank}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdventureSection() {
  const cards = [
    { img: photos.outdoorAdventure.camping, title: "Camping", copy: "Monthly campouts in Florida and nearby states." },
    { img: photos.outdoorAdventure.hiking, title: "Hiking & backpacking", copy: "Day hikes through multi-day treks, depending on the season." },
    { img: photos.outdoorAdventure.waterSports, title: "Aquatics", copy: "Canoeing, kayaking, and swimming as part of summer program." },
  ];
  return (
    <section className="border-y border-border/60 bg-sand py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl text-foreground md:text-5xl">Campouts and activities</h2>
            <p className="mt-4 text-muted-foreground">
              The calendar changes every year, but scouts can count on regular outdoor weekends,
              service days, and summer camp.
            </p>
          </div>
          <Link to="/events" className="btn-outline">View events <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <article key={c.title} className="group overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-transform hover:-translate-y-1">
              <div className="aspect-[4/3] overflow-hidden">
                <TroopPhoto src={c.img} alt={c.title} width={1400} height={900} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" label={c.title} />
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventsAndAnnouncements() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      fetchUpcomingEvents(4).catch(() => [] as EventRow[]),
      fetchActiveAnnouncements().catch(() => [] as AnnouncementRow[]),
    ]).then(([ev, ann]) => {
      setEvents(ev);
      setAnnouncements(ann);
      setLoading(false);
    });
  }, []);
  return (
    <section className="py-24">
      <div className="container-page grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="font-display text-4xl md:text-5xl">Upcoming events</h2>
          <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
            {events.map((e) => {
              const d = new Date(e.starts_at);
              const date = d.toLocaleString("en-US", { month: "short", day: "numeric" });
              const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
              return (
                <li key={e.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-5 md:gap-6">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-forest text-cream">
                    <Calendar size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{date} · {time}</div>
                    <div className="font-display text-lg text-foreground md:text-xl">{e.title}</div>
                    {e.location && <div className="truncate text-sm text-muted-foreground">{e.location}</div>}
                  </div>
                  <Link to="/calendar" className="shrink-0 text-sm font-medium text-forest hover:underline">Calendar</Link>
                </li>
              );
            })}
            {loading && <li className="p-6 text-sm text-muted-foreground">Loading events…</li>}
            {!loading && events.length === 0 && (
              <li className="p-6 text-sm text-muted-foreground">No upcoming events yet.</li>
            )}
          </ul>
          <div className="mt-6">
            <Link to="/calendar" className="btn-outline">See full calendar <ArrowRight size={16} /></Link>
          </div>
        </div>

        <aside id="announcements" className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-forest-deep p-8 text-cream">
            <h3 className="font-display text-2xl text-cream">Announcements</h3>
            <ul className="mt-6 space-y-5 text-sm text-cream/85">
              {announcements.map((a) => (
                <li key={a.id} className="border-b border-cream/10 pb-5 last:border-0 last:pb-0">
                  {a.title && a.title !== a.body && (
                    <div className="font-medium text-cream">{a.title}</div>
                  )}
                  <p className={a.title && a.title !== a.body ? "mt-1 text-cream/80" : ""}>{a.body}</p>
                </li>
              ))}
              {!loading && announcements.length === 0 && (
                <li className="text-cream/60">No announcements at the moment.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

function mosaicTileClass(index: number, total: number): string {
  const base = "group relative overflow-hidden rounded-xl bg-forest-deep/10";
  if (total === 1) return `${base} col-span-2 aspect-[16/10] md:col-span-12 md:row-span-6 md:aspect-auto md:min-h-[28rem]`;
  if (index === 0) return `${base} col-span-2 row-span-2 aspect-[16/10] md:col-span-7 md:row-span-4 md:aspect-auto md:min-h-0`;
  if (index === 1) return `${base} aspect-square md:col-span-5 md:row-span-2 md:aspect-auto`;
  if (index === 2) return `${base} aspect-square md:col-span-5 md:row-span-2 md:aspect-auto`;
  return `${base} aspect-square md:col-span-4 md:row-span-2 md:aspect-auto`;
}

function PhotoMosaic({ photos: mosaicPhotos }: { photos: MosaicPhoto[] }) {
  if (mosaicPhotos.length === 0) return null;

  return (
    <section className="border-y border-border/60 bg-forest-deep py-24 text-cream">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl text-cream md:text-5xl">Photos from the troop</h2>
            <p className="mt-3 max-w-xl text-sm text-cream/75">
              Campouts, courts of honor, and service projects. Parents can share photos from the gallery page.
            </p>
          </div>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:gap-2.5 transition-all"
          >
            Open the gallery <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-12 md:grid-rows-6 md:gap-3 md:min-h-[28rem]">
          {mosaicPhotos.map((photo, index) => (
            <Link
              key={`${photo.src}-${index}`}
              to="/gallery"
              className={mosaicTileClass(index, mosaicPhotos.length)}
            >
              <TroopPhoto
                src={photo.src}
                alt={photo.alt}
                width={1400}
                height={900}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                label="Troop photo"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-deep/50 via-transparent to-transparent opacity-80" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickLinksPreview() {
  const links = [
    { label: "Health Forms", href: "https://filestore.scouting.org/filestore/healthsafety/pdf/680-001_ab.pdf" },
    { label: "Online Payments", href: "/quick-links" },
    { label: "Scoutbook", href: "/quick-links" },
    { label: "TroopTrack", href: "/quick-links" },
    { label: "Youth Protection", href: "/quick-links" },
    { label: "Merit Badges", href: "/quick-links" },
  ];
  return (
    <section className="py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">Quick links</h2>
            <p className="mt-2 text-muted-foreground">Forms, payments, and scout resources.</p>
          </div>
          <Link to="/quick-links" className="btn-outline">All quick links <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {links.map((l) => {
            const external = l.href.startsWith("http");
            const El = external ? "a" : Link;
            return (
              <El
                key={l.label}
                {...(external ? { href: l.href, target: "_blank", rel: "noopener noreferrer" } : { to: l.href })}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-forest"
              >
                <span className="font-medium">{l.label}</span>
                <ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-forest" />
              </El>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="pb-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-forest px-8 py-16 text-cream md:px-14 md:py-20">
          <div className="relative max-w-2xl">
            <h2 className="font-display text-4xl text-cream md:text-5xl">Visit us on a Wednesday</h2>
            <p className="mt-4 text-cream/85">
              Meetings start at 7 PM at North Collier Fire Station #45. Scouts and parents are
              welcome—no appointment needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/join" className="btn-primary bg-gold !text-forest-deep hover:brightness-110">How to join</Link>
              <Link to="/about" className="btn-outline !border-cream/30 !text-cream hover:!bg-cream/10">About the troop</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
