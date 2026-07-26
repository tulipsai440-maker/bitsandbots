import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { TroopPhoto } from "@/components/site/TroopPhoto";
import { ArrowRight, Calendar } from "lucide-react";
import { fetchUpcomingEvents, type EventRow } from "@/lib/events";
import { photoForEventType } from "@/lib/photos";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Troop 2001 Naples" },
      { name: "description", content: "Campouts, ceremonies, and adventures from Troop 2001 Naples." },
      { property: "og:title", content: "Troop 2001 Events" },
      { property: "og:description", content: "Campouts, ceremonies, and adventures." },
    ],
  }),
  component: EventsPage,
});

function formatEventDate(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const startStr = start.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (!endsAt) return startStr;
  const end = new Date(endsAt);
  if (start.toDateString() === end.toDateString()) {
    return `${startStr} · ${start.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  return `${start.toLocaleString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents(5)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Events"
        title="From campouts to Courts of Honor."
        align="center"
        description="The upcoming troop activities."
      />
      <section className="py-16">
        <div className="container-page">
          {loading && <p className="text-sm text-muted-foreground">Loading events…</p>}
          {!loading && events.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="font-display text-2xl text-foreground">Nothing on the schedule right now.</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                New campouts, ceremonies, and service projects are posted here as they are planned.
                In the meantime, scouts and parents are welcome at our weekly meeting — Wednesdays at
                7:00 PM at North Collier Fire Station #45.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/calendar" className="btn-outline inline-flex gap-2">
                  View calendar <ArrowRight size={16} />
                </Link>
                <Link to="/join" className="btn-primary inline-flex gap-2">
                  Join Troop 2001 <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            {events.slice(0, 5).map((e) => (
              <article key={e.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-0.5">
                <div className="relative h-24 overflow-hidden bg-sand sm:h-28">
                  <TroopPhoto
                    src={photoForEventType(e.type)}
                    alt={`${e.type} event — ${e.title}`}
                    width={640}
                    height={240}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    label={e.type}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/30 to-transparent" />
                  <span className="absolute bottom-2 left-3 rounded-full bg-forest/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-cream">
                    {e.type}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-forest">
                    <Calendar size={14} /> {formatEventDate(e.starts_at, e.ends_at)}
                  </div>
                  <h3 className="mt-2 font-display text-xl leading-tight">{e.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {e.description || e.location || "Details coming soon."}
                  </p>
                  <Link to="/calendar" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:gap-2.5 transition-all">
                    Calendar <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
