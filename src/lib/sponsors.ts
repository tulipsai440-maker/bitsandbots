import { supabase } from "@/integrations/supabase/client";
import { usesDemoPlaceholders } from "@/lib/demo/app-mode";
import { DEMO_SPONSORS } from "@/lib/demo/demo-fallbacks";
import { isDemoTenant } from "@/lib/tenant/context";
import { withTenantFilter } from "@/lib/tenant/query";
import { resolveTenantIdForFetch } from "@/lib/tenant/resolve";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

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
  const useDemoFallbacks = usesDemoPlaceholders() || isDemoTenant();
  try {
    const tenantId = await resolveTenantIdForFetch();
    let query = supabase
      .from("sponsors")
      .select("id, name, description, logo_url, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    query = withTenantFilter(query, tenantId);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return useDemoFallbacks ? DEMO_SPONSORS : SPONSORS;
    return (data as SponsorRow[]).map(mapRow);
  } catch (error) {
    console.error("[sponsors]", error);
    return useDemoFallbacks ? DEMO_SPONSORS : SPONSORS;
  }
}

export async function fetchAllSponsorsAdmin(): Promise<Sponsor[]> {
  const tenantId = await tenantIdForQuery();
  let query = supabase
    .from("sponsors")
    .select("id, name, description, logo_url, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  query = withTenantFilter(query, tenantId);
  const { data, error } = await query;
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
  const tenantId = await tenantIdForQuery();
  const payload = {
    name: input.name.trim() || "Coming soon",
    description: input.description?.trim() || null,
    logo_url: input.logoUrl || null,
    sort_order: input.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
    tenant_id: tenantId,
  };

  if (input.id) {
    const { error } = await supabase
      .from("sponsors")
      .update(payload)
      .eq("id", input.id)
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("sponsors").insert(payload);
  if (error) throw error;
}

export async function deleteSponsor(id: string): Promise<void> {
  const tenantId = await tenantIdForQuery();
  const { error } = await supabase.from("sponsors").delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) throw error;
}
