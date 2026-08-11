import { supabase } from "@/integrations/supabase/client";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

// Tables from supabase/setup-parent-contacts.sql — cast until types are regenerated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type ParentContact = {
  id: string;
  teamMemberId: string;
  parentName: string;
  relation: string;
  phone: string;
  email: string;
  sortOrder: number;
};

export type FamilyRosterRow = {
  teamMemberId: string;
  kidName: string;
  sortOrder: number;
  email: string;
  phone: string;
  dateOfBirth: string; // yyyy-mm-dd or ""
  parents: ParentContact[];
};

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === "object" && "message" in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error(String(error ?? "Request failed"));
}

export function parentContactsErrorMessage(error: unknown): string {
  return toError(error).message;
}

export function isParentContactsSetupMissing(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  const message = toError(error).message.toLowerCase();
  return (
    err.code === "PGRST205" ||
    err.code === "42P01" ||
    message.includes("participant_details") ||
    message.includes("parent_contacts") ||
    message.includes("schema cache")
  );
}

export const PARENT_CONTACTS_SETUP_SQL = `-- See supabase/setup-parent-contacts.sql in the project repo.
-- Open that file, copy all, paste into Supabase SQL Editor, Run.`;

export async function fetchFamilyRosterAdmin(): Promise<FamilyRosterRow[]> {
  const tenantId = await tenantIdForQuery();
  let memberQuery = supabase
    .from("team_members")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  memberQuery = withTenantFilter(memberQuery, tenantId);
  const { data: members, error: memberError } = await memberQuery;
  if (memberError) throw toError(memberError);

  const memberIds = (members ?? []).map((m) => m.id as string);

  const { data: details, error: detailsError } =
    memberIds.length > 0
      ? await db
          .from("participant_details")
          .select("team_member_id, email, phone, date_of_birth")
          .in("team_member_id", memberIds)
      : { data: [], error: null };
  if (detailsError) throw toError(detailsError);

  const { data: parents, error: parentsError } =
    memberIds.length > 0
      ? await db
          .from("parent_contacts")
          .select("id, team_member_id, parent_name, relation, phone, email, sort_order")
          .in("team_member_id", memberIds)
          .order("sort_order", { ascending: true })
      : { data: [], error: null };
  if (parentsError) throw toError(parentsError);

  const detailsById = new Map(
    (details ?? []).map((d: Record<string, unknown>) => [d.team_member_id as string, d]),
  );
  const parentsById = new Map<string, ParentContact[]>();
  for (const p of parents ?? []) {
    const row = p as Record<string, unknown>;
    const memberId = row.team_member_id as string;
    const list = parentsById.get(memberId) ?? [];
    list.push({
      id: row.id as string,
      teamMemberId: memberId,
      parentName: (row.parent_name as string) ?? "",
      relation: (row.relation as string) ?? "Parent",
      phone: (row.phone as string) ?? "",
      email: (row.email as string) ?? "",
      sortOrder: (row.sort_order as number) ?? 0,
    });
    parentsById.set(memberId, list);
  }

  // Ensure every kid has a details row (admin-only upsert)
  const missing = (members ?? []).filter((m) => !detailsById.has(m.id));
  if (missing.length > 0) {
    const { error: ensureError } = await db.from("participant_details").upsert(
      missing.map((m) => ({ team_member_id: m.id })),
      { onConflict: "team_member_id", ignoreDuplicates: true },
    );
    if (ensureError) throw toError(ensureError);
  }

  return (members ?? []).map((m) => {
    const d = detailsById.get(m.id);
    return {
      teamMemberId: m.id,
      kidName: m.name,
      sortOrder: m.sort_order,
      email: (d?.email as string | null) ?? "",
      phone: (d?.phone as string | null) ?? "",
      dateOfBirth: (d?.date_of_birth as string | null) ?? "",
      parents: parentsById.get(m.id) ?? [],
    };
  });
}

export async function saveParticipantDetails(input: {
  teamMemberId: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}): Promise<void> {
  const { error } = await db.from("participant_details").upsert(
    {
      team_member_id: input.teamMemberId,
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      date_of_birth: input.dateOfBirth.trim() || null,
    },
    { onConflict: "team_member_id" },
  );
  if (error) throw toError(error);
}

export async function saveParentContact(input: {
  id?: string;
  teamMemberId: string;
  parentName: string;
  relation: string;
  phone: string;
  email: string;
  sortOrder: number;
}): Promise<void> {
  if (!input.parentName.trim()) throw new Error("Parent name is required");

  const payload = {
    team_member_id: input.teamMemberId,
    parent_name: input.parentName.trim(),
    relation: input.relation.trim() || "Parent",
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    sort_order: input.sortOrder,
  };

  if (input.id) {
    const { error } = await db.from("parent_contacts").update(payload).eq("id", input.id);
    if (error) throw toError(error);
    return;
  }

  const { error } = await db.from("parent_contacts").insert(payload);
  if (error) throw toError(error);
}

export async function deleteParentContact(id: string): Promise<void> {
  const { error } = await db.from("parent_contacts").delete().eq("id", id);
  if (error) throw toError(error);
}
