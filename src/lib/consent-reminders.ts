/**
 * Email parents of teammates who have not signed the media consent form.
 */

import {
  buildConsentReminderEmail,
  type ConsentReminderRecipient,
} from "@/lib/media-consent-copy";
import { loadCoachCcEmailsServer } from "@/lib/coach-cc-emails";
import {
  consentFormUrl,
  emailFromFallback,
  loadTeamBrandingServer,
} from "@/lib/team-branding";

export type { ConsentReminderRecipient } from "@/lib/media-consent-copy";

export type UnsignedConsentFamily = {
  teamMemberId: string;
  kidName: string;
  recipients: Array<{ email: string; parentName: string }>;
};

function normalizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : null;
}

function groupRecipients(families: UnsignedConsentFamily[]): ConsentReminderRecipient[] {
  const byEmail = new Map<string, ConsentReminderRecipient>();

  for (const family of families) {
    for (const { email, parentName } of family.recipients) {
      const normalized = normalizeEmail(email);
      if (!normalized) continue;

      const existing = byEmail.get(normalized) ?? {
        email: normalized,
        parentName: parentName.trim() || "there",
        kidNames: [],
      };
      if (!existing.kidNames.includes(family.kidName)) {
        existing.kidNames.push(family.kidName);
      }
      if (parentName.trim() && existing.parentName === "there") {
        existing.parentName = parentName.trim();
      }
      byEmail.set(normalized, existing);
    }
  }

  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

/** Admin client: unsigned kids + parent emails from roster. */
export async function fetchUnsignedConsentFamilies(): Promise<UnsignedConsentFamily[]> {
  const { fetchFamilyRosterAdmin } = await import("@/lib/parent-contacts");
  const { fetchMediaConsentedMemberIds, normalizeMemberId } = await import("@/lib/parent-consent");

  const [roster, consentedIds] = await Promise.all([
    fetchFamilyRosterAdmin(),
    fetchMediaConsentedMemberIds(),
  ]);

  const consented = new Set(consentedIds.map(normalizeMemberId));

  return roster
    .filter((row) => !consented.has(normalizeMemberId(row.teamMemberId)))
    .map((row) => ({
      teamMemberId: row.teamMemberId,
      kidName: row.kidName,
      recipients: row.parents
        .map((p) => ({
          email: p.email.trim(),
          parentName: p.parentName.trim(),
        }))
        .filter((p) => normalizeEmail(p.email)),
    }));
}

/** Server-only load (service role). */
export async function fetchUnsignedConsentFamiliesServer(): Promise<UnsignedConsentFamily[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const { data: members, error: memberError } = await admin
    .from("team_members")
    .select("id, name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (memberError) throw new Error(memberError.message);

  const { data: consents, error: consentError } = await admin
    .from("parent_media_consents")
    .select("team_member_id");
  if (consentError && !consentError.message.includes("parent_media_consents")) {
    throw new Error(consentError.message);
  }

  const consented = new Set(
    (consents ?? []).map((r: { team_member_id: string }) =>
      String(r.team_member_id).trim().toLowerCase(),
    ),
  );

  const unsignedIds = (members ?? [])
    .filter((m: { id: string }) => !consented.has(String(m.id).trim().toLowerCase()))
    .map((m: { id: string; name: string }) => ({ id: m.id as string, name: m.name as string }));

  if (unsignedIds.length === 0) return [];

  const memberIds = unsignedIds.map((m) => m.id);
  const { data: parents, error: parentsError } = await admin
    .from("parent_contacts")
    .select("team_member_id, parent_name, email")
    .in("team_member_id", memberIds)
    .order("sort_order", { ascending: true });
  if (parentsError) throw new Error(parentsError.message);

  const parentsByMember = new Map<string, Array<{ email: string; parentName: string }>>();
  for (const row of parents ?? []) {
    const email = normalizeEmail(String(row.email ?? ""));
    if (!email) continue;
    const memberId = String(row.team_member_id);
    const list = parentsByMember.get(memberId) ?? [];
    list.push({
      email,
      parentName: String(row.parent_name ?? "").trim(),
    });
    parentsByMember.set(memberId, list);
  }

  return unsignedIds.map((member) => ({
    teamMemberId: member.id,
    kidName: member.name,
    recipients: parentsByMember.get(member.id) ?? [],
  }));
}

async function sendOneEmail(
  apiKey: string,
  fromAddress: string,
  to: string,
  subject: string,
  text: string,
  html: string,
  cc?: string[],
) {
  const body: Record<string, unknown> = {
    from: fromAddress,
    to: [to],
    subject,
    text,
    html,
  };
  if (cc?.length) body.cc = cc;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Failed to send to ${to}`);
  }
}

async function loadCoachCc(): Promise<string[]> {
  return loadCoachCcEmailsServer();
}

export type ConsentReminderSendResult = {
  sent: number;
  total: number;
  skippedNoEmail: string[];
  failures: string[];
};

export async function sendConsentFormReminders(): Promise<ConsentReminderSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is missing. Add it to .env (see supabase/EMAIL-SETUP.txt) and restart the server.",
    );
  }

  const branding = await loadTeamBrandingServer();
  const fromAddress = emailFromFallback(branding);
  const formUrl = consentFormUrl(branding);

  const families = await fetchUnsignedConsentFamiliesServer();
  const skippedNoEmail = families.filter((f) => f.recipients.length === 0).map((f) => f.kidName);
  const recipients = groupRecipients(families);

  if (recipients.length === 0) {
    if (families.length === 0) {
      return { sent: 0, total: 0, skippedNoEmail: [], failures: [] };
    }
    throw new Error(
      "No parent emails on file for unsigned teammates. Add emails under Admin → Parents first.",
    );
  }

  const coachCc = await loadCoachCc();
  let sent = 0;
  const failures: string[] = [];

  for (const recipient of recipients) {
    const { subject, text, html } = buildConsentReminderEmail(branding, recipient, formUrl);
    try {
      await sendOneEmail(apiKey, fromAddress, recipient.email, subject, text, html, coachCc);
      sent += 1;
    } catch (err) {
      failures.push(
        `${recipient.email}: ${err instanceof Error ? err.message : "send failed"}`,
      );
    }
  }

  if (sent === 0) {
    throw new Error(failures[0] ?? "No emails were sent.");
  }

  return { sent, total: recipients.length, skippedNoEmail, failures };
}
