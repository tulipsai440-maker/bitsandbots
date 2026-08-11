import { supabase } from "@/integrations/supabase/client";
import type { Coach } from "@/lib/coaches";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

export type CoachAdminRow = Coach & {
  email?: string;
  sortOrder: number;
};

type Row = {
  id: string;
  name: string;
  email: string | null;
  description: string | null;
  photo_url: string | null;
  sort_order: number;
};

function mapRow(row: Row): CoachAdminRow {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    description: row.description ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    sortOrder: row.sort_order,
  };
}

export async function fetchAllCoachesAdmin(): Promise<CoachAdminRow[]> {
  const tenantId = await tenantIdForQuery();
  let query = supabase
    .from("coaches")
    .select("id, name, email, description, photo_url, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  query = withTenantFilter(query, tenantId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Row[]).map(mapRow);
}

export async function saveCoach(input: {
  id?: string;
  name: string;
  email?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  sortOrder?: number;
}): Promise<void> {
  const tenantId = await tenantIdForQuery();
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    photo_url: input.photoUrl || null,
    sort_order: input.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
    tenant_id: tenantId,
  };
  const email = input.email?.trim().toLowerCase();
  if (email !== undefined) {
    payload.email = email && email.includes("@") ? email : null;
  }

  if (input.id) {
    const { error } = await supabase
      .from("coaches")
      .update(payload)
      .eq("id", input.id)
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("coaches").insert(payload);
  if (error) throw error;
}

export async function deleteCoach(id: string): Promise<void> {
  const tenantId = await tenantIdForQuery();
  const { error } = await supabase.from("coaches").delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) throw error;
}
