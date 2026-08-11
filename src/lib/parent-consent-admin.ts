import { supabase } from "@/integrations/supabase/client";
import {
  isParentConsentSetupMissing,
  parentConsentErrorMessage,
} from "@/lib/parent-consent";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type ParentMediaConsentRow = {
  id: string;
  teamMemberId: string;
  kidName: string;
  motherName: string | null;
  motherEmail: string | null;
  motherPhone: string | null;
  fatherName: string | null;
  fatherEmail: string | null;
  fatherPhone: string | null;
  signedByName: string;
  signedByRelation: string;
  signatureDate: string;
  consentVersion: string;
  createdAt: string;
};

export { isParentConsentSetupMissing, parentConsentErrorMessage };

export async function fetchParentMediaConsentsAdmin(): Promise<ParentMediaConsentRow[]> {
  const tenantId = await tenantIdForQuery();

  let memberQuery = supabase.from("team_members").select("id");
  memberQuery = withTenantFilter(memberQuery, tenantId);
  const { data: members, error: memberError } = await memberQuery;
  if (memberError) throw new Error(memberError.message);

  const memberIds = (members ?? []).map((m) => m.id as string);
  if (!memberIds.length) return [];

  const { data, error } = await db
    .from("parent_media_consents")
    .select(
      `
      id,
      team_member_id,
      mother_name,
      mother_email,
      mother_phone,
      father_name,
      father_email,
      father_phone,
      signed_by_name,
      signed_by_relation,
      signature_date,
      consent_version,
      created_at,
      team_members!inner ( name )
    `,
    )
    .in("team_member_id", memberIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const member = row.team_members as { name: string };
    return {
      id: row.id as string,
      teamMemberId: row.team_member_id as string,
      kidName: member.name,
      motherName: (row.mother_name as string | null) ?? null,
      motherEmail: (row.mother_email as string | null) ?? null,
      motherPhone: (row.mother_phone as string | null) ?? null,
      fatherName: (row.father_name as string | null) ?? null,
      fatherEmail: (row.father_email as string | null) ?? null,
      fatherPhone: (row.father_phone as string | null) ?? null,
      signedByName: row.signed_by_name as string,
      signedByRelation: row.signed_by_relation as string,
      signatureDate: row.signature_date as string,
      consentVersion: row.consent_version as string,
      createdAt: row.created_at as string,
    };
  });
}
