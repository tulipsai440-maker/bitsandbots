import { supabase } from "@/integrations/supabase/client";
import type { CalendarRow } from "@/lib/events";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

export type CalendarAdminRow = CalendarRow;

function normalizeTime(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  // HTML time inputs are HH:MM; Postgres prefers HH:MM:SS
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed.slice(0, 8);
  return trimmed;
}

function explainError(error: { message?: string; code?: string; details?: string; hint?: string }): string {
  const msg = error.message ?? "Save failed";
  if (msg.toLowerCase().includes("schema cache") || error.code === "PGRST205") {
    return "Calendar table is missing. Run supabase/setup-calendar.sql in the Supabase SQL Editor.";
  }
  if (msg.toLowerCase().includes("row-level security") || error.code === "42501") {
    return "Permission denied saving calendar. Sign in as admin, then run supabase/fix-calendar-rls.sql.";
  }
  return [msg, error.details, error.hint].filter(Boolean).join(" — ");
}

export async function fetchAllCalendarAdmin(): Promise<CalendarAdminRow[]> {
  const tenantId = await tenantIdForQuery();
  let query = supabase
    .from("calendar")
    .select("id, event_date, title, agenda, location, start_time, end_time")
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });
  query = withTenantFilter(query, tenantId);
  const { data, error } = await query;
  if (error) throw new Error(explainError(error));
  return (data ?? []) as CalendarAdminRow[];
}

export async function saveCalendarEvent(input: {
  id?: string;
  event_date: string;
  title: string;
  agenda?: string | null;
  location?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}): Promise<void> {
  const tenantId = await tenantIdForQuery();
  const payload = {
    event_date: input.event_date,
    title: input.title.trim(),
    agenda: input.agenda?.trim() || null,
    location: input.location?.trim() || null,
    start_time: normalizeTime(input.start_time),
    end_time: normalizeTime(input.end_time),
    updated_at: new Date().toISOString(),
    tenant_id: tenantId,
  };

  if (input.id) {
    const { error } = await supabase
      .from("calendar")
      .update(payload)
      .eq("id", input.id)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(explainError(error));
    return;
  }

  const { error } = await supabase.from("calendar").insert(payload);
  if (error) throw new Error(explainError(error));
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const tenantId = await tenantIdForQuery();
  const { error } = await supabase.from("calendar").delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) throw new Error(explainError(error));
}
