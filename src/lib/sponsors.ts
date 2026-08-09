import { supabase } from "@/integrations/supabase/client";

export type Sponsor = {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  sortOrder?: number;
};

/** Static fallback if Supabase table is empty/unavailable */
export const SPONSORS: Sponsor[] = [
  { id: "sponsor-1", name: "Coming soon" },
  { id: "sponsor-2", name: "Coming soon" },
  { id: "sponsor-3", name: "Coming soon" },
];

type SponsorRow = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  sort_order: number;
};

function mapRow(row: SponsorRow): Sponsor {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    sortOrder: row.sort_order,
  };
}

export async function fetchSponsors(): Promise<Sponsor[]> {
  try {
    const { data, error } = await supabase
      .from("sponsors")
      .select("id, name, description, logo_url, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    if (!data?.length) return SPONSORS;
    return (data as SponsorRow[]).map(mapRow);
  } catch (error) {
    console.error("[sponsors]", error);
    return SPONSORS;
  }
}

export async function fetchAllSponsorsAdmin(): Promise<Sponsor[]> {
  const { data, error } = await supabase
    .from("sponsors")
    .select("id, name, description, logo_url, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as SponsorRow[]).map(mapRow);
}

export async function saveSponsor(input: {
  id?: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  sortOrder?: number;
}): Promise<void> {
  const payload = {
    name: input.name.trim() || "Coming soon",
    description: input.description?.trim() || null,
    logo_url: input.logoUrl || null,
    sort_order: input.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("sponsors").update(payload).eq("id", input.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("sponsors").insert(payload);
  if (error) throw error;
}

export async function deleteSponsor(id: string): Promise<void> {
  const { error } = await supabase.from("sponsors").delete().eq("id", id);
  if (error) throw error;
}
