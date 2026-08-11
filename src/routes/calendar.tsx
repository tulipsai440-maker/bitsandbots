import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { MapPin } from "lucide-react";
import { fetchAllEvents, type EventRow } from "@/lib/events";
import { CalendarEventEditor } from "@/components/admin/inline-edit/CalendarEventEditor";
import { useAdminEdit } from "@/components/admin/inline-edit/AdminEditProvider";
import { EditableText } from "@/components/admin/inline-edit/EditableText";
import { useSiteSettings } from "@/lib/site-settings-context";
import { brandingRouteLoader, routeTeamName } from "@/lib/team-branding";
import { parseAdminEditSearch } from "@/lib/admin-route-search";

export const Route = createFileRoute("/calendar")({
  validateSearch: parseAdminEditSearch,
  loader: brandingRouteLoader,
  head: ({ loaderData }) => {
    const name = routeTeamName(loaderData);
    return {
      meta: [
        { title: `Calendar — ${name}` },
        {
          name: "description",
          content: `${name} team calendar and upcoming events.`,
        },
        { property: "og:title", content: `${name} Calendar` },
        {
          property: "og:description",
          content: "Upcoming team events and meeting times.",
        },
      ],
    };
  },
  component: CalendarPage,
});

function formatEventTime(event: EventRow): string {
  const start = new Date(event.starts_at);
  const startLabel = start.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  if (!event.ends_at) return startLabel;
  const end = new Date(event.ends_at);
  const endLabel = end.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${startLabel}–${endLabel}`;
}

function CalendarPage() {
  const { canInlineEdit } = useAdminEdit();
  const { calendarHeroTitle, calendarHeroDescription } = useSiteSettings();

  return (
    <SiteLayout>
      {!canInlineEdit && (
        <PageHero title={calendarHeroTitle} align="center" description={calendarHeroDescription} />
      )}

      <section className={canInlineEdit ? "pb-14 pt-2 md:pb-16 md:pt-4" : "py-14 md:py-16"}>
        <div className="container-page">
          {canInlineEdit ? <CalendarEventEditor standalone /> : <PublicCalendarView />}
        </div>
      </section>
    </SiteLayout>
  );
}

function PublicCalendarView() {
  const { practiceSummary, practicePlace, zoomSummary, zoomPlace } = useSiteSettings();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => new Date(event.starts_at).getTime() >= now);
  }, [events]);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm leading-relaxed text-muted-foreground">
        <strong className="font-medium text-foreground">Team practice</strong> ·{" "}
        <EditableText settingKey="practiceSummary" label="Practice schedule">
          {practiceSummary}
        </EditableText>{" "}
        ·{" "}
        <EditableText settingKey="practicePlace" label="Practice location">
          {practicePlace}
        </EditableText>
        <br />
        <strong className="font-medium text-foreground">Zoom call</strong> ·{" "}
        <EditableText settingKey="zoomSummary" label="Zoom schedule">
          {zoomSummary}
        </EditableText>{" "}
        ·{" "}
        <EditableText settingKey="zoomPlace" label="Zoom location">
          {zoomPlace}
        </EditableText>
      </p>

      <div className="mt-10">
        <h2 className="font-display text-3xl md:text-4xl">Upcoming events</h2>
        <ul className="mt-6 space-y-3">
          {upcoming.map((event) => {
            const date = new Date(event.starts_at);
            const month = date.toLocaleString("en-US", { month: "short" });
            const day = date.getDate();
            const weekday = date.toLocaleString("en-US", { weekday: "long" });

            return (
              <li
                key={event.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5"
              >
                <div className="flex gap-4 md:gap-5">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-border bg-sand text-center md:h-20 md:w-20">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-forest">
                        {month}
                      </div>
                      <div className="font-display text-2xl leading-none md:text-3xl">{day}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {weekday} · {formatEventTime(event)}
                    </div>
                    <h3 className="mt-1 font-display text-lg md:text-xl">{event.title}</h3>
                    {event.location && (
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin size={14} className="shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.description && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {!loading && upcoming.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
              No upcoming events scheduled yet.
            </li>
          )}
          {loading && <li className="text-sm text-muted-foreground">Loading events…</li>}
        </ul>
      </div>
    </div>
  );
}
