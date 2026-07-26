import { supabase } from "@/integrations/supabase/client";

export type ContentStatus = "pending" | "approved" | "rejected";

export type EagleScoutRow = {
  id: string;
  year: string;
  name: string;
  project: string;
  status: ContentStatus;
  submitted_by_email: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type RankedEagleScoutRow = EagleScoutRow & { rank: number };

function parseEagleYear(year: string): number {
  const parsed = Number.parseInt(year, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Newest Eagle first (#1), then alphabetical within the same year. */
export function sortEagleScoutsForDisplay(eagles: EagleScoutRow[]): EagleScoutRow[] {
  return [...eagles].sort((a, b) => {
    const yearDiff = parseEagleYear(b.year) - parseEagleYear(a.year);
    if (yearDiff !== 0) return yearDiff;

    const nameDiff = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    if (nameDiff !== 0) return nameDiff;

    const aTime = a.reviewed_at ?? a.created_at;
    const bTime = b.reviewed_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });
}

/** Assign display ranks from the sorted list so add/remove/update always stay in sync. */
export function rankEagleScouts(eagles: EagleScoutRow[]): RankedEagleScoutRow[] {
  return sortEagleScoutsForDisplay(eagles).map((eagle, index) => ({
    ...eagle,
    rank: index + 1,
  }));
}

export function countApprovedEagleScouts(eagles: EagleScoutRow[]): number {
  return eagles.filter((e) => e.status === "approved").length;
}

/**
 * Counts live on every request, so adds, deletions, and approvals are reflected immediately.
 * Returns null when the count is unavailable so callers can hide the stat rather than show zero.
 */
export async function fetchApprovedEagleScoutCount(): Promise<number | null> {
  try {
    const { url, key } = supabasePublicConfig();
    const res = await fetch(`${url}/rest/v1/eagle_scouts?select=id&status=eq.approved`, {
      method: "HEAD",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const total = res.headers.get("content-range")?.split("/")[1];
    const parsed = Number.parseInt(total ?? "", 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export type ScoutmasterRow = {
  id: string;
  name: string;
  years: string;
  bio: string | null;
  photo_url: string | null;
  status: ContentStatus;
  submitted_by_email: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

function supabasePublicConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error("[content] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
    throw new Error("This list is temporarily unavailable. Please check back shortly.");
  }
  return { url, key };
}

function normalizeEagleScout(row: Record<string, unknown>): EagleScoutRow {
  return {
    id: String(row.id),
    year: String(row.year ?? ""),
    name: String(row.name ?? ""),
    project: String(row.project ?? ""),
    status: row.status as ContentStatus,
    submitted_by_email: (row.submitted_by_email as string | null) ?? null,
    admin_notes: (row.admin_notes as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
  };
}

export async function fetchApprovedEagleScouts(): Promise<EagleScoutRow[]> {
  const { url, key } = supabasePublicConfig();
  const res = await fetch(
    `${url}/rest/v1/eagle_scouts?select=*&status=eq.approved&order=year.desc&order=name.asc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Failed to load Eagle Scouts (${res.status})`);
  }
  const data = (await res.json()) as Record<string, unknown>[];
  return sortEagleScoutsForDisplay(data.map(normalizeEagleScout));
}

function normalizeScoutmaster(row: Record<string, unknown>): ScoutmasterRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    years: String(row.years ?? row.title ?? ""),
    bio: (row.bio as string | null) ?? null,
    photo_url: (row.photo_url as string | null) ?? null,
    status: row.status as ContentStatus,
    submitted_by_email: (row.submitted_by_email as string | null) ?? null,
    admin_notes: (row.admin_notes as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
  };
}

export async function fetchApprovedScoutmasters(): Promise<ScoutmasterRow[]> {
  const { url, key } = supabasePublicConfig();
  const res = await fetch(
    `${url}/rest/v1/scoutmasters?select=*&status=eq.approved&order=created_at.desc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Failed to load scoutmasters (${res.status})`);
  }
  const data = (await res.json()) as Record<string, unknown>[];
  return data.map(normalizeScoutmaster);
}

export async function fetchAllEagleScouts(): Promise<EagleScoutRow[]> {
  const { data, error } = await supabase
    .from("eagle_scouts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) =>
    normalizeEagleScout(row as unknown as Record<string, unknown>),
  );
}

export async function fetchAllScoutmasters(): Promise<ScoutmasterRow[]> {
  const { data, error } = await supabase
    .from("scoutmasters")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) =>
    normalizeScoutmaster(row as unknown as Record<string, unknown>),
  );
}

export async function submitEagleScoutSuggestion(input: {
  year: string;
  name: string;
  project: string;
  submittedByEmail?: string;
}) {
  const { url, key } = supabasePublicConfig();
  const payload: Record<string, string> = {
    year: input.year.trim(),
    name: input.name.trim(),
    project: input.project.trim(),
    status: "pending",
  };

  const res = await fetch(`${url}/rest/v1/eagle_scouts`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(parsePostgrestError(body, res.status));
  }
}

const SUBMIT_FAILED_MESSAGE =
  "We couldn't send that submission right now. Please try again in a moment, or mention it to a troop leader at a Wednesday meeting.";

/** Public visitors see a friendly message; the technical cause goes to the console for admins. */
function parsePostgrestError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as { message?: string; hint?: string; code?: string };
    console.error("[content] Submission failed", status, parsed.message ?? body);
  } catch {
    console.error("[content] Submission failed", status, body);
  }
  return SUBMIT_FAILED_MESSAGE;
}

export async function submitScoutmasterSuggestion(input: {
  name: string;
  years: string;
  bio?: string;
  submittedByEmail?: string;
}) {
  const { url, key } = supabasePublicConfig();
  const payload: Record<string, string | null> = {
    name: input.name.trim(),
    years: input.years.trim(),
    bio: input.bio?.trim() || null,
    status: "pending",
  };

  const res = await fetch(`${url}/rest/v1/scoutmasters`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(parsePostgrestError(body, res.status));
  }
}
