import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { fetchAllEvents, fetchUpcomingEvents, getLastEventsSource, type EventRow } from "@/lib/events";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Troop 2001 Naples" },
      { name: "description", content: "Month-by-month calendar of Troop 2001 meetings, campouts, ceremonies, and events." },
      { property: "og:title", content: "Troop 2001 Calendar" },
      { property: "og:description", content: "Meetings, campouts, and events." },
    ],
  }),
  component: CalendarPage,
});

const typeColor: Record<string, string> = {
  Meeting: "bg-navy/15 text-navy border-navy/20",
  Ceremony: "bg-gold/30 text-forest-deep border-gold/40",
  Campout: "bg-forest/20 text-forest border-forest/30",
  Deadline: "bg-destructive/10 text-destructive border-destructive/20",
  Service: "bg-tan/40 text-forest-deep border-tan",
  Other: "bg-muted text-foreground border-border",
};

const typeSolid: Record<string, string> = {
  Meeting: "bg-navy text-cream",
  Ceremony: "bg-gold text-forest-deep",
  Campout: "bg-forest text-cream",
  Deadline: "bg-destructive text-destructive-foreground",
  Service: "bg-tan text-forest-deep",
  Other: "bg-muted-foreground text-cream",
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selected, setSelected] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>("");

  useEffect(() => {
    fetchAllEvents()
      .then((rows) => {
        setEvents(rows);
        setSource(getLastEventsSource());
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, []);

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  // Build 6-week grid starting on Sunday
  const weeks = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push(d);
    }
    const rows: Date[][] = [];
    for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, i * 7 + 7));
    return rows;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const d = new Date(e.starts_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return events.filter((e) => new Date(e.starts_at) >= now).slice(0, 20);
  }, [events]);

  const today = new Date();

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Calendar"
        title="What's coming up."
        align="center"
        description="Meetings, campouts, and ceremonies month by month."
      />

      <section className="py-16">
        <div className="container-page">
          {/* Legend */}
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.keys(typeColor).map((t) => (
              <span key={t} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${typeColor[t]}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />{t}
              </span>
            ))}
          </div>

          {/* Month controls */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCursor(addMonths(cursor, -1))}
                className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-muted"
                aria-label="Previous month"
              ><ChevronLeft size={18} /></button>
              <button
                onClick={() => setCursor(addMonths(cursor, 1))}
                className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-muted"
                aria-label="Next month"
              ><ChevronRight size={18} /></button>
              <button
                onClick={() => setCursor(startOfMonth(new Date()))}
                className="ml-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
              >Today</button>
            </div>
            <h2 className="font-display text-2xl md:text-3xl">{monthLabel}</h2>
          </div>

          {/* Grid */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="grid grid-cols-7 border-b border-border bg-sand text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="p-3">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-6">
              {weeks.flat().map((d, idx) => {
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = sameDay(d, today);
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                const dayEvents = eventsByDay.get(key) ?? [];
                return (
                  <div
                    key={idx}
                    className={`min-h-[92px] border-b border-r border-border p-1.5 last:border-r-0 ${idx % 7 === 6 ? "border-r-0" : ""} ${inMonth ? "" : "bg-sand/40"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-medium ${isToday ? "bg-forest text-cream" : inMonth ? "text-foreground" : "text-muted-foreground"}`}>
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${typeSolid[e.type] ?? typeSolid.Other}`}
                          title={e.title}
                        >
                          {e.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="px-1.5 text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {loading && <div className="mt-4 text-sm text-muted-foreground">Loading events…</div>}

          {/* Upcoming list */}
          <div className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="eyebrow">Upcoming</div>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">Next on the schedule</h2>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {upcoming.map((e) => {
                const d = new Date(e.starts_at);
                const month = d.toLocaleString("en-US", { month: "short" });
                const day = d.getDate();
                const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
                const weekday = d.toLocaleString("en-US", { weekday: "long" });
                return (
                  <li key={e.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:gap-6 md:p-5">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-border bg-sand text-center md:h-20 md:w-20">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-forest">{month}</div>
                        <div className="font-display text-2xl leading-none md:text-3xl">{day}</div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">{weekday} · {time}</div>
                      <button onClick={() => setSelected(e)} className="text-left font-display text-lg hover:underline md:text-xl">
                        {e.title}
                      </button>
                      {e.location && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin size={14} className="shrink-0" /> <span className="truncate">{e.location}</span>
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${typeColor[e.type] ?? typeColor.Other}`}>{e.type}</span>
                  </li>
                );
              })}
              {!loading && upcoming.length === 0 && (
                <li className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  Nothing scheduled just yet. Troop meetings are every Wednesday at 7:00 PM at North
                  Collier Fire Station #45 — visitors are always welcome.
                </li>
              )}
            </ul>
          </div>

          {source === "band" && (
            <div className="mt-10 rounded-2xl border border-dashed border-border bg-sand/50 p-6 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <CalendarIcon size={18} className="mt-0.5 text-forest" />
                <div>
                  <div className="font-medium text-foreground">Kept up to date by troop leaders</div>
                  <p>
                    This calendar updates automatically as events are added. Dates, times, and
                    locations can change — check back before heading out, or ask a leader at the
                    Wednesday meeting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Event detail dialog */}
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-forest-deep/60 p-4" onClick={() => setSelected(null)}>
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg"
            onClick={(ev) => ev.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
              aria-label="Close"
            ><X size={18} /></button>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${typeColor[selected.type] ?? typeColor.Other}`}>{selected.type}</span>
            <h3 className="mt-4 font-display text-2xl">{selected.title}</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              {new Date(selected.starts_at).toLocaleString(undefined, {
                weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
              })}
              {selected.ends_at && (
                <> – {new Date(selected.ends_at).toLocaleString(undefined, { hour: "numeric", minute: "2-digit" })}</>
              )}
            </div>
            {selected.location && (
              <div className="mt-3 flex items-start gap-2 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0 text-forest" />
                <span>{selected.location}</span>
              </div>
            )}
            {selected.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {selected.description}
              </p>
            )}
            {selected.band_url && (
              <a
                href={selected.band_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline"
              >
                View on Band <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
