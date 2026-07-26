import { getBandEvents } from "./band.functions";
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

export type EventsSource = "band" | "supabase" | "none" | "band-error";

let lastSource: EventsSource = "none";

export function getLastEventsSource(): EventsSource {
  return lastSource;
}

async function loadBandEvents(): Promise<EventRow[]> {
  const result = await getBandEvents();
  if (result.source === "band") {
    lastSource = "band";
    return result.events;
  }
  if (result.source === "band-error") {
    lastSource = "band-error";
    return [];
  }
  lastSource = "none";
  return [];
}

async function loadSupabaseUpcoming(limit: number): Promise<EventRow[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at, ends_at, type, band_url")
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  lastSource = "supabase";
  return (data ?? []) as EventRow[];
}

async function loadSupabaseAll(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at, ends_at, type, band_url")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  lastSource = "supabase";
  return (data ?? []) as EventRow[];
}

export async function fetchUpcomingEvents(limit = 20): Promise<EventRow[]> {
  const band = await loadBandEvents();
  if (band.length > 0) {
    const now = Date.now();
    return band.filter((e) => new Date(e.starts_at).getTime() >= now).slice(0, limit);
  }
  try {
    return await loadSupabaseUpcoming(limit);
  } catch {
    lastSource = "none";
    return [];
  }
}

export async function fetchAllSupabaseEvents(): Promise<EventRow[]> {
  try {
    return await loadSupabaseAll();
  } catch {
    lastSource = "none";
    return [];
  }
}

export async function fetchAllEvents(): Promise<EventRow[]> {
  const band = await loadBandEvents();
  if (band.length > 0) return band;
  try {
    return await loadSupabaseAll();
  } catch {
    lastSource = "none";
    return [];
  }
}

export async function getEventsSource(): Promise<EventsSource> {
  await fetchAllEvents();
  return lastSource;
}
