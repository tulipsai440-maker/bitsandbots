import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { TroopPhoto } from "@/components/site/TroopPhoto";
import { photos } from "@/lib/photos";
import { ArrowRight, Calendar, Compass, Award, ChevronRight, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchUpcomingEvents, type EventRow } from "@/lib/events";
import { fetchActiveAnnouncements, type AnnouncementRow } from "@/lib/announcements";
import { fetchApprovedEagleScoutCount } from "@/lib/content";
import { galleryPhotos } from "@/lib/gallery-photos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Troop 2001 Naples — Scouts BSA in Naples, Florida" },
      { name: "description", content: "Adventure, leadership, and Eagle Scout achievement. Troop 2001 meets Wednesdays at 7 PM in Naples, Florida. Join us." },
      { property: "og:image", content: `https://troop2001naples.org${photos.ogLogo}` },
    ],
  }),
  loader: async () => ({ eagleCount: await fetchApprovedEagleScoutCount() }),
  component: HomePage,
});

// Prefer real troop photos from the gallery; fall back to the stock set when it is empty.
const slides =
  galleryPhotos.length > 0
    ? [photos.hero, ...galleryPhotos.slice(0, 4).map((p) => p.src)]
    : photos.slideshow;

function HomePage() {
  const { eagleCount } = Route.useLoaderData();

  return (
    <SiteLayout>
      <Hero eagleCount={eagleCount} />
      <EagleSection />
      <AdventureSection />
      <EventsAndAnnouncements />
      <PhotoSlideshow />
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
        alt="Scouts on a mountain ridge at sunrise"
        width={1920}
        height={1200}
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
        label="Hero photo"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-forest-deep/55 to-forest-deep/85" />
      <div className="relative">
        <div className="container-page flex min-h-[86vh] flex-col items-center justify-end pb-16 pt-32 text-center text-cream md:min-h-[92vh] md:pb-24">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl leading-[1.02] text-cream md:text-7xl">
              Adventure begins <em className="not-italic text-gold">on the trail</em>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream/85 md:text-lg">
              Since 2000, Troop 2001 has helped young people in Naples grow into leaders through
              camping, service, and the rank of Eagle Scout.
            </p>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-cream md:text-lg">
              We inspire boys to become confident explorers, engaged citizens, and ethical leaders.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/join" className="btn-primary bg-gold !text-forest-deep hover:!bg-gold hover:brightness-110">
                Join Troop 2001 <ArrowRight size={16} />
              </Link>
              <Link to="/about" className="btn-outline !border-cream/30 !text-cream hover:!bg-cream/10">
                Learn about us
              </Link>
            </div>
          </div>

          <div
            className={`mt-16 grid w-full gap-6 border-t border-cream/15 pt-8 text-left sm:grid-cols-2 ${
              showEagleStat ? "max-w-5xl md:grid-cols-4" : "max-w-4xl md:grid-cols-3"
            }`}
          >
            <Stat label="Founded" value="2000" />
            {showEagleStat && (
              <Link to="/eagle-scouts" className="group">
                <div className="text-[11px] uppercase tracking-[0.22em] text-cream/60">Eagle Scouts</div>
                <div className="mt-1 font-display text-2xl text-gold md:text-3xl">
                  {count}
                  <span className="ml-1.5 inline-block text-base text-cream/70 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </div>
              </Link>
            )}
            <Stat label="Meets" value="Wednesdays · 7:00 PM" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-cream/60 flex items-center gap-1.5"><MapPin size={12} /> Meeting Location</div>
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
      <div className="text-[11px] uppercase tracking-[0.22em] text-cream/60">{label}</div>
      <div className="mt-1 font-display text-2xl text-cream md:text-3xl">{value}</div>
    </div>
  );
}

function EagleSection() {
  return (
    <section className="py-24">
      <div className="container-page grid gap-12 md:grid-cols-2 md:items-center">
        <div className="relative overflow-hidden rounded-2xl">
          <TroopPhoto src={photos.trailToEagle} alt="Eagle Scout medal on uniform" width={1600} height={1100} className="h-full w-full object-cover" label="Eagle Scout" />
        </div>
        <div>
          <div className="eyebrow">The Trail to Eagle</div>
          <h2 className="mt-3 font-display text-4xl text-foreground md:text-5xl">Where scouts become <em className="text-forest not-italic">Eagles</em>.</h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Only about 6% of scouts nationwide earn the rank of Eagle. At Troop 2001, we mentor
            each scout through the journey — from Tenderfoot to a service project that leaves a
            mark on our community.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-foreground/80">
            <li className="flex items-start gap-3"><Award size={18} className="mt-0.5 text-gold" /> Trail-tested leadership development</li>
            <li className="flex items-start gap-3"><Award size={18} className="mt-0.5 text-gold" /> Merit badge coaching and mentorship</li>
            <li className="flex items-start gap-3"><Award size={18} className="mt-0.5 text-gold" /> Eagle project planning and support</li>
          </ul>
          <div className="mt-8">
            <Link to="/eagle-scouts" className="btn-primary">See our Eagle Scouts <ChevronRight size={16} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdventureSection() {
  const cards = [
    { img: photos.outdoorAdventure.camping, title: "Camping", copy: "Monthly campouts across Florida and the Southeast." },
    { img: photos.outdoorAdventure.hiking, title: "Hiking & Backpacking", copy: "From day hikes to high adventure treks." },
    { img: photos.outdoorAdventure.waterSports, title: "Water Sports", copy: "Canoeing, kayaking, sailing, and swimming." },
  ];
  return (
    <section className="border-y border-border/60 bg-sand py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="eyebrow">Outdoor Adventure</div>
            <h2 className="mt-3 font-display text-4xl text-foreground md:text-5xl">A year full of the outdoors.</h2>
            <p className="mt-4 text-muted-foreground">
              Scouting happens outside. Our program balances skills, service, and pure adventure
              across Southwest Florida and beyond.
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
                <div className="flex items-center gap-2 text-forest">
                  <Compass size={16} />
                  <span className="eyebrow !text-forest">Program</span>
                </div>
                <h3 className="mt-2 font-display text-2xl">{c.title}</h3>
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
          <div className="eyebrow">Upcoming</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">On the calendar.</h2>
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
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">{date} · {time}</div>
                    <div className="font-display text-lg text-foreground md:text-xl">{e.title}</div>
                    {e.location && <div className="truncate text-sm text-muted-foreground">{e.location}</div>}
                  </div>
                  <Link to="/calendar" className="shrink-0 text-sm font-medium text-forest hover:underline">Details →</Link>
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
            <div className="eyebrow !text-gold">Announcements</div>
            <h3 className="mt-3 font-display text-2xl text-cream">Latest from the troop</h3>
            <ul className="mt-6 space-y-5 text-sm text-cream/85">
              {announcements.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <div>
                    {a.title && a.title !== a.body && (
                      <div className="font-medium text-cream">{a.title}</div>
                    )}
                    <p className={a.title && a.title !== a.body ? "mt-1 text-cream/80" : ""}>{a.body}</p>
                  </div>
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

function PhotoSlideshow() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="border-y border-border/60 bg-forest-deep py-24 text-cream">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow !text-gold">Photo Slideshow</div>
            <h2 className="mt-3 font-display text-4xl text-cream md:text-5xl">Moments from the trail.</h2>
            <Link
              to="/gallery"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:gap-2.5 transition-all"
            >
              See the full photo gallery <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-gold" : "w-2 bg-cream/30"}`}
              />
            ))}
          </div>
        </div>
        <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-2xl">
          {slides.map((s, idx) => (
            <TroopPhoto
              key={idx}
              src={s}
              alt="Troop 2001 activities"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`}
              label="Slideshow"
            />
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
            <div className="eyebrow">Quick Links</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Everything scouts and parents need.</h2>
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
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${photos.home.flag})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="relative max-w-2xl">
            <div className="eyebrow !text-gold">Join Us</div>
            <h2 className="mt-3 font-display text-4xl text-cream md:text-5xl">Ready to start the adventure?</h2>
            <p className="mt-4 text-cream/85">
              Visit us any Wednesday at 7 PM at North Collier Fire Station #45. Scouts and parents
              are always welcome — no experience needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/join" className="btn-primary bg-gold !text-forest-deep hover:brightness-110">Join Troop 2001</Link>
              <Link to="/about" className="btn-outline !border-cream/30 !text-cream hover:!bg-cream/10">Meet the troop</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
