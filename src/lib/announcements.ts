import { supabase } from "@/integrations/supabase/client";

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  published_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  active: boolean;
};

function normalizeAnnouncement(row: Record<string, unknown>): AnnouncementRow {
  const expiresAt = (row.expires_at as string | null) ?? null;
  const active = !expiresAt || new Date(expiresAt).getTime() > Date.now();
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    published_at: String(row.published_at ?? row.created_at ?? ""),
    expires_at: expiresAt,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    active,
  };
}

const SELECT =
  "id,title,body,published_at,expires_at,created_at,updated_at";

export async function fetchActiveAnnouncements(): Promise<AnnouncementRow[]> {
  const now = new Date();
  const { data, error } = await supabase
    .from("announcements")
    .select(SELECT)
    .lte("published_at", now.toISOString())
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row) => normalizeAnnouncement(row as unknown as Record<string, unknown>))
    .filter((row) => row.active);
}

export async function fetchAllAnnouncements(): Promise<AnnouncementRow[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select(SELECT)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) =>
    normalizeAnnouncement(row as unknown as Record<string, unknown>),
  );
}
