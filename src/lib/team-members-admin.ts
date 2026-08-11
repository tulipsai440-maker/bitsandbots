import { supabase } from "@/integrations/supabase/client";
import type { TeamMember } from "@/lib/team-members";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

export type TeamMemberAdminRow = TeamMember & {
  sortOrder: number;
};

type Row = {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  sort_order: number;
};

function mapRow(row: Row): TeamMemberAdminRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    sortOrder: row.sort_order,
  };
}

export async function fetchAllTeamMembersAdmin(): Promise<TeamMemberAdminRow[]> {
  const tenantId = await tenantIdForQuery();
  let query = supabase
    .from("team_members")
    .select("id, name, description, photo_url, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  query = withTenantFilter(query, tenantId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Row[]).map(mapRow);
}

export async function saveTeamMember(input: {
  id?: string;
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  sortOrder?: number;
}): Promise<void> {
  const tenantId = await tenantIdForQuery();
  const payload = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    photo_url: input.photoUrl || null,
    sort_order: input.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
    tenant_id: tenantId,
  };

  if (input.id) {
    const { error } = await supabase
      .from("team_members")
      .update(payload)
      .eq("id", input.id)
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("team_members").insert(payload);
  if (error) throw error;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const tenantId = await tenantIdForQuery();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}
