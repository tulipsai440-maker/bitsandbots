import { supabase } from "@/integrations/supabase/client";

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  type: string;
  band_url: string | null;
};

export type CalendarRow = {
  id: string;
  event_date: string;
  title: string;
  agenda: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
};

export type EventsSource = "supabase" | "none";

let lastSource: EventsSource = "none";

export function getLastEventsSource(): EventsSource {
  return lastSource;
}

function atLocal(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(year, month, day, hour, minute, 0, 0);
}

function iso(d: Date): string {
  return d.toISOString();
}

function parseTime(value: string | null, fallbackHour: number, fallbackMinute: number): {
  hour: number;
  minute: number;
} {
  if (!value) return { hour: fallbackHour, minute: fallbackMinute };
  const [h, m] = value.split(":").map((part) => Number(part));
  if (Number.isFinite(h) && Number.isFinite(m)) return { hour: h, minute: m };
  return { hour: fallbackHour, minute: fallbackMinute };
}

function eventTypeFromTitle(_title: string): string {
  return "Event";
}

/** Map calendar table rows → EventRow used by the public site. */
export function calendarRowsToEvents(rows: CalendarRow[]): EventRow[] {
  return rows
    .map((row) => {
      const [y, m, d] = row.event_date.split("-").map(Number);
      const start = parseTime(row.start_time, 15, 0);
      const end = parseTime(row.end_time, 17, 0);
      const starts = atLocal(y, m - 1, d, start.hour, start.minute);
      const ends = atLocal(y, m - 1, d, end.hour, end.minute);
      const type = eventTypeFromTitle(row.title);
      return {
        id: row.id,
        title: row.title,
        description: row.agenda,
        location: row.location,
        starts_at: iso(starts),
        ends_at: iso(ends),
        type,
        band_url: null,
      } satisfies EventRow;
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

async function fetchCalendarRows(): Promise<CalendarRow[]> {
  const { data, error } = await supabase
    .from("calendar")
    .select("id, event_date, title, agenda, location, start_time, end_time")
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[calendar]", error.message);
    lastSource = "none";
    throw new Error(
      error.message.toLowerCase().includes("schema cache") || error.code === "PGRST205"
        ? "Calendar table missing. Run supabase/setup-calendar.sql in Supabase."
        : error.message,
    );
  }

  lastSource = (data?.length ?? 0) > 0 ? "supabase" : "none";
  return (data ?? []) as CalendarRow[];
}

/** All public calendar events — managed only via Admin → Calendar (Supabase `calendar` table). */
export async function fetchAllEvents(): Promise<EventRow[]> {
  const rows = await fetchCalendarRows();
  return calendarRowsToEvents(rows);
}

export async function fetchUpcomingEvents(limit = 20): Promise<EventRow[]> {
  const now = Date.now();
  return (await fetchAllEvents())
    .filter((e) => new Date(e.starts_at).getTime() >= now)
    .slice(0, limit);
}

export async function fetchAllSupabaseEvents(): Promise<EventRow[]> {
  return fetchAllEvents();
}

export async function getEventsSource(): Promise<EventsSource> {
  try {
    await fetchAllEvents();
  } catch {
    lastSource = "none";
  }
  return lastSource;
}
