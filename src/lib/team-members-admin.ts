import { supabase } from "@/integrations/supabase/client";
import type { TeamMember } from "@/lib/team-members";

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
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, description, photo_url, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
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
  const payload = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    photo_url: input.photoUrl || null,
    sort_order: input.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("team_members").update(payload).eq("id", input.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("team_members").insert(payload);
  if (error) throw error;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw error;
}
