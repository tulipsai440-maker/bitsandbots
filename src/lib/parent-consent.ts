import { supabase } from "@/integrations/supabase/client";
import { fetchTeamMembers, type TeamMember } from "@/lib/team-members";
import {
  buildMediaConsentBothParentsNote,
  buildMediaConsentIntro,
  buildMediaConsentTerms,
} from "@/lib/media-consent-copy";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

export {
  buildMediaConsentBothParentsNote,
  buildMediaConsentIntro,
  buildMediaConsentTerms,
} from "@/lib/media-consent-copy";

/** Media consent copy version stored with each submission. */
export const MEDIA_CONSENT_VERSION = "2026-media-v1";

export type ParentMediaConsentInput = {
  teamMemberId: string;
  motherName: string;
  motherEmail: string;
  motherPhone: string;
  fatherName: string;
  fatherEmail: string;
  fatherPhone: string;
  signedByName: string;
  signedByRelation: string;
  signatureDate: string;
  agreesWebsite: boolean;
  agreesSocialMedia: boolean;
};

/** Teammates still needing consent — signed kids are excluded. */
export async function fetchConsentEligibleMembers(): Promise<TeamMember[]> {
  const members = await fetchTeamMembers();
  try {
    const consented = new Set((await fetchMediaConsentedMemberIds()).map(normalizeMemberId));
    return members.filter((member) => !consented.has(normalizeMemberId(member.id)));
  } catch (error) {
    if (isParentConsentSetupMissing(error)) return members;
    console.error("[parent-consent] list consented ids", parentConsentErrorMessage(error));
    return members;
  }
}

/** Normalize member id from DB/RPC for reliable Set lookups. */
export function normalizeMemberId(id: unknown): string {
  return String(id ?? "").trim().toLowerCase();
}

/** Kid IDs with a signed media consent on file. */
export async function fetchMediaConsentedMemberIds(): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const tenantId = await tenantIdForQuery();

  let memberQuery = supabase.from("team_members").select("id");
  memberQuery = withTenantFilter(memberQuery, tenantId);
  const { data: members, error: memberError } = await memberQuery;
  if (memberError) throw new Error(memberError.message);
  const memberIds = (members ?? []).map((m) => m.id as string);
  if (!memberIds.length) return [];

  const { data: rows, error: tableError } = await db
    .from("parent_media_consents")
    .select("team_member_id")
    .in("team_member_id", memberIds);

  if (!tableError && Array.isArray(rows)) {
    const ids = new Set<string>();
    for (const row of rows) {
      const id = normalizeMemberId(row.team_member_id);
      if (id) ids.add(id);
    }
    return [...ids];
  }

  if (tableError && !isParentConsentSetupMissing(tableError)) {
    console.warn("[parent-consent] table read failed, using RPC", tableError.message);
  }

  const { data, error } = await db.rpc("list_media_consented_member_ids", {
    p_tenant_id: tenantId,
  });
  if (error) {
    if (isParentConsentSetupMissing(error)) return [];
    throw new Error(error.message);
  }

  const ids = new Set<string>();
  for (const item of data ?? []) {
    const id = normalizeMemberId(item);
    if (id) ids.add(id);
  }
  return [...ids];
}

export function parentConsentErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error ?? "Request failed");
  const lower = raw.toLowerCase();
  if (
    lower.includes("importing a module script failed") ||
    lower.includes("failed to fetch dynamically imported module")
  ) {
    return "The form could not connect. Refresh this page and try again.";
  }
  return raw;
}

export function isParentConsentSetupMissing(error: unknown): boolean {
  const message = parentConsentErrorMessage(error).toLowerCase();
  return (
    message.includes("parent_media_consents") ||
    message.includes("list_media_consented_member_ids") ||
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    message.includes("could not find the function")
  );
}
