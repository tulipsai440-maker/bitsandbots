import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { fetchAllEvents, type EventRow } from "@/lib/events";
import {
  MEETINGS_BLURB,
  PRACTICE_PLACE,
  PRACTICE_SUMMARY,
  SITE_NAME,
  ZOOM_PLACE,
  ZOOM_SUMMARY,
} from "@/lib/photos";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: `Calendar — ${SITE_NAME}` },
      {
        name: "description",
        content: `${SITE_NAME} recurring meetings: ${MEETINGS_BLURB}`,
      },
      { property: "og:title", content: `${SITE_NAME} Calendar` },
      {
        property: "og:description",
        content: "Team practice Sundays and Zoom calls Wednesdays.",
      },
    ],
  }),
  component: CalendarPage,
});

const typeColor: Record<string, string> = {
  Practice: "bg-navy/15 text-navy border-navy/20",
  Zoom: "bg-forest/15 text-forest border-forest/25",
  Meeting: "bg-navy/10 text-navy border-navy/15",
  Competition: "bg-gold/25 text-forest-deep border-gold/40",
  Outreach: "bg-forest/10 text-forest border-forest/20",
  Deadline: "bg-muted text-foreground border-border",
  Other: "bg-muted text-foreground border-border",
};

const typeSolid: Record<string, string> = {
  Practice: "bg-navy text-cream",
  Zoom: "bg-forest text-cream",
  Meeting: "bg-navy/80 text-cream",
  Competition: "bg-gold text-forest-deep",
  Outreach: "bg-forest text-cream",
  Deadline: "bg-muted-foreground text-cream",
  Other: "bg-muted-foreground text-cream",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selected, setSelected] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const maxMonth = useMemo(() => {
    if (events.length === 0) return startOfMonth(new Date());
    const last = events.reduce((a, b) =>
      new Date(a.starts_at).getTime() > new Date(b.starts_at).getTime() ? a : b,
    );
    return startOfMonth(new Date(last.starts_at));
  }, [events]);

  useEffect(() => {
    setCursor((c) => {
      const month = startOfMonth(c);
      return month.getTime() > maxMonth.getTime() ? maxMonth : month;
    });
  }, [maxMonth]);

  const clampToMaxMonth = (d: Date) => {
    const month = startOfMonth(d);
    return month.getTime() > maxMonth.getTime() ? maxMonth : month;
  };

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });
  const canGoNext = cursor.getTime() < maxMonth.getTime();

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
        title="Team calendar"
        align="center"
        description="All meetings and team events — managed from Admin → Calendar."
      />

      <section className="py-16">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.keys(typeColor).map((t) => (
              <span
                key={t}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${typeColor[t]}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {t}
              </span>
            ))}
          </div>

          <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
            {PRACTICE_SUMMARY} at {PRACTICE_PLACE}. {ZOOM_SUMMARY} ({ZOOM_PLACE}).
          </p>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCursor(addMonths(cursor, -1))}
                className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-muted"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  if (!canGoNext) return;
                  setCursor(clampToMaxMonth(addMonths(cursor, 1)));
                }}
                disabled={!canGoNext}
                className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setCursor(clampToMaxMonth(new Date()))}
                className="ml-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Today
              </button>
            </div>
            <h2 className="font-display text-2xl md:text-3xl">{monthLabel}</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="grid grid-cols-7 border-b border-border bg-sand text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="p-3">
                  {d}
                </div>
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
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-xs font-medium ${isToday ? "bg-forest text-cream" : inMonth ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${typeSolid[e.type] ?? "bg-muted-foreground text-cream"}`}
                          title={e.title}
                        >
                          {e.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="px-1.5 text-[10px] text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {loading && <div className="mt-4 text-sm text-muted-foreground">Loading events…</div>}

          <div className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl md:text-4xl">Upcoming meetings</h2>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {upcoming.map((e) => {
                const d = new Date(e.starts_at);
                const month = d.toLocaleString("en-US", { month: "short" });
                const day = d.getDate();
                const time = d.toLocaleString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });
                const weekday = d.toLocaleString("en-US", { weekday: "long" });
                return (
                  <li
                    key={e.id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:gap-6 md:p-5"
                  >
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-border bg-sand text-center md:h-20 md:w-20">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-forest">
                          {month}
                        </div>
                        <div className="font-display text-2xl leading-none md:text-3xl">{day}</div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        {weekday} · {time}
                      </div>
                      <button
                        onClick={() => setSelected(e)}
                        className="text-left font-display text-lg hover:underline md:text-xl"
                      >
                        {e.title}
                      </button>
                      {e.location && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin size={14} className="shrink-0" />{" "}
                          <span className="truncate">{e.location}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${typeColor[e.type] ?? "bg-muted text-foreground border-border"}`}
                    >
                      {e.type}
                    </span>
                  </li>
                );
              })}
              {!loading && upcoming.length === 0 && (
                <li className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  No upcoming meetings yet. Add them in Admin → Calendar.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-forest-deep/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg"
            onClick={(ev) => ev.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${typeColor[selected.type] ?? "bg-muted text-foreground border-border"}`}
            >
              {selected.type}
            </span>
            <h3 className="mt-4 font-display text-2xl">{selected.title}</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              {new Date(selected.starts_at).toLocaleString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              {selected.ends_at && (
                <>
                  {" "}
                  –{" "}
                  {new Date(selected.ends_at).toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </>
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
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
