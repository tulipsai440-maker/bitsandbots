import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MEDIA_CONSENT_VERSION } from "@/lib/parent-consent";
import { fetchTeamMembers } from "@/lib/team-members";

const emailOrEmpty = z.union([z.literal(""), z.string().email("Enter a valid email address")]);

const schema = z.object({
  teamMemberId: z.string().uuid("Select a teammate"),
  motherName: z.string().max(120),
  motherEmail: emailOrEmpty,
  motherPhone: z.string().max(40),
  fatherName: z.string().max(120),
  fatherEmail: emailOrEmpty,
  fatherPhone: z.string().max(40),
  signedByName: z.string().min(2, "Enter your full name as signature").max(120),
  signedByRelation: z.enum(["Mother", "Father", "Guardian", "Other"]),
  signatureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  agreesWebsite: z.boolean().refine((v) => v, "Website consent is required"),
  agreesSocialMedia: z.boolean().refine((v) => v, "Social media consent is required"),
});

/** Public: teammates who still need a consent (already-signed kids are omitted). */
export const fetchConsentEligibleMembers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const members = await fetchTeamMembers();

  const { data, error } = await admin.from("parent_media_consents").select("team_member_id");
  if (error) {
    if (
      error.message.includes("parent_media_consents") ||
      error.message.includes("schema cache")
    ) {
      return members;
    }
    console.error("[parent-consent] list consented", error.message);
    return members;
  }

  const consented = new Set(
    (data ?? []).map((row: { team_member_id: string }) => row.team_member_id),
  );
  return members.filter((m) => !consented.has(m.id));
});

/** Public: submit parent media consent (stored via service role). */
export const submitParentMediaConsent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = supabaseAdmin as any;

    const { data: member, error: memberError } = await admin
      .from("team_members")
      .select("id, name")
      .eq("id", data.teamMemberId)
      .maybeSingle();

    if (memberError || !member) {
      throw new Error("Could not find that teammate. Refresh and try again.");
    }

    const trim = (s: string | undefined) => s?.trim() || null;
    const motherName = trim(data.motherName);
    const fatherName = trim(data.fatherName);

    if (!motherName && !fatherName) {
      throw new Error("Enter at least one parent name (mother or father).");
    }

    const { data: existing, error: existingError } = await admin
      .from("parent_media_consents")
      .select("id")
      .eq("team_member_id", data.teamMemberId)
      .maybeSingle();

    if (existingError && !existingError.message.includes("parent_media_consents")) {
      throw new Error(existingError.message);
    }
    if (existing) {
      throw new Error(`${member.name} already has consent on file. Refresh the page if you need another child.`);
    }

    const { error: insertError } = await admin.from("parent_media_consents").insert({
      team_member_id: data.teamMemberId,
      mother_name: motherName,
      mother_email: trim(data.motherEmail),
      mother_phone: trim(data.motherPhone),
      father_name: fatherName,
      father_email: trim(data.fatherEmail),
      father_phone: trim(data.fatherPhone),
      signed_by_name: data.signedByName.trim(),
      signed_by_relation: data.signedByRelation,
      signature_date: data.signatureDate,
      consent_version: MEDIA_CONSENT_VERSION,
      agrees_website: data.agreesWebsite,
      agrees_social_media: data.agreesSocialMedia,
    });

    if (insertError) {
      console.error("[parent-consent] insert", insertError.message);
      if (
        insertError.message.includes("parent_media_consents") ||
        insertError.message.includes("schema cache")
      ) {
        throw new Error(
          "Consent storage is not set up yet. Ask a coach to run supabase/setup-parent-media-consents.sql.",
        );
      }
      throw new Error(insertError.message);
    }

    return {
      ok: true as const,
      memberId: member.id as string,
      memberName: member.name as string,
    };
  });
