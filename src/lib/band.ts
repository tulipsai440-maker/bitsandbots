import type { EventRow } from "./events";

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache: { fetchedAt: number; events: EventRow[] } | null = null;

/** Normalize webcal:// → https:// for server fetch */
export function normalizeBandIcalUrl(url: string): string {
  return url.trim().replace(/^webcal:\/\//i, "https://");
}

export function getBandIcalUrl(): string | null {
  const url = process.env.BAND_ICAL_URL?.trim();
  return url ? normalizeBandIcalUrl(url) : null;
}

export function inferEventType(title: string, description: string | null): string {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  if (text.includes("zoom")) return "Zoom";
  if (text.includes("practice") || text.includes("build") || text.includes("robot")) return "Practice";
  if (text.includes("competition") || text.includes("tournament") || text.includes("qualifier")) {
    return "Competition";
  }
  if (text.includes("outreach") || text.includes("expo") || text.includes("demo")) return "Outreach";
  if (text.includes("meeting") || text.includes("check-in") || text.includes("check in")) return "Meeting";
  if (text.includes("deadline") || text.includes("due")) return "Deadline";
  return "Other";
}

/** Skip Band auto-events (birthdays, band anniversaries) */
export function isTeamEvent(title: string, description: string | null): boolean {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  if (text.includes("birthday")) return false;
  if (text.includes("band was created")) return false;
  return true;
}

/** @deprecated Use isTeamEvent */
export const isTroopEvent = isTeamEvent;

function unfoldIcsLines(raw: string): string[] {
  const folded = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "");
  return folded.split("\n");
}

function readProp(lines: string[], key: string): string | null {
  const prefix = `${key}:`;
  const prefixParam = `${key};`;
  for (const line of lines) {
    if (line.startsWith(prefix)) return line.slice(prefix.length).trim();
    if (line.startsWith(prefixParam)) {
      const idx = line.indexOf(":");
      if (idx >= 0) return line.slice(idx + 1).trim();
    }
  }
  return null;
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/** Parse ICS DATE or DATE-TIME (Band uses standard iCal) */
export function parseIcsDate(value: string): Date | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6)) - 1;
    const d = Number(v.slice(6, 8));
    return new Date(y, m, d, 0, 0, 0, 0);
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return null;
  const [, ys, ms, ds, hs, mins, ss, z] = m;
  if (z) {
    return new Date(Date.UTC(+ys, +ms - 1, +ds, +hs, +mins, +ss));
  }
  return new Date(+ys, +ms - 1, +ds, +hs, +mins, +ss);
}

export function parseBandIcal(raw: string): EventRow[] {
  const lines = unfoldIcsLines(raw);
  const events: EventRow[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i] !== "BEGIN:VEVENT") {
      i++;
      continue;
    }
    const block: string[] = [];
    i++;
    while (i < lines.length && lines[i] !== "END:VEVENT") {
      block.push(lines[i]);
      i++;
    }
    i++;

    const uid = readProp(block, "UID") ?? crypto.randomUUID();
    const summary = unescapeIcsText(readProp(block, "SUMMARY") ?? "Untitled event");
    const descriptionRaw = readProp(block, "DESCRIPTION");
    const description = descriptionRaw ? unescapeIcsText(descriptionRaw) : null;
    if (!isTeamEvent(summary, description)) continue;
    const locationRaw = readProp(block, "LOCATION");
    const location = locationRaw ? unescapeIcsText(locationRaw) : null;
    const url = readProp(block, "URL");
    const starts = parseIcsDate(readProp(block, "DTSTART") ?? "");
    if (!starts) continue;

    const endsRaw = readProp(block, "DTEND");
    const ends = endsRaw ? parseIcsDate(endsRaw) : null;

    events.push({
      id: `band-${uid}`,
      title: summary,
      description,
      location,
      starts_at: starts.toISOString(),
      ends_at: ends?.toISOString() ?? null,
      type: inferEventType(summary, description),
      band_url: url,
    });
  }

  return events.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
}

export async function fetchBandEventsFromEnv(): Promise<EventRow[]> {
  const url = getBandIcalUrl();
  if (!url) return [];

  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.events;
  }

  const res = await fetch(url, {
    headers: { Accept: "text/calendar, text/plain, */*" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`Band calendar fetch failed (${res.status})`);
  }

  const text = await res.text();
  const events = parseBandIcal(text);
  cache = { fetchedAt: now, events };
  return events;
}

export function clearBandEventsCache() {
  cache = null;
}
