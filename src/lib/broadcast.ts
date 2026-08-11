import { supabase } from "@/integrations/supabase/client";
import {
  normalizeWhatsAppPhone,
  uniquePhonesFromParentRows,
} from "@/lib/broadcast-phones";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

export { normalizeWhatsAppPhone, uniquePhonesFromParentRows };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const DEFAULT_WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/I14hN2OpZci2C2F4RsquwQ";

export function broadcastErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error ?? "Request failed");
}

export function isBroadcastSetupMissing(error: unknown): boolean {
  const message = broadcastErrorMessage(error).toLowerCase();
  if (message.includes("broadcast_settings")) return true;
  if (message.includes("could not find the table") && message.includes("broadcast")) return true;
  if (message.includes("schema cache") && message.includes("broadcast")) return true;
  return false;
}

/** True when broadcast_settings exists and the current admin can read it. */
export async function probeBroadcastSettingsTable(): Promise<boolean> {
  const tenantId = await tenantIdForQuery();
  const { error } = await withTenantFilter(
    db.from("broadcast_settings").select("id"),
    tenantId,
  ).maybeSingle();
  if (!error) return true;
  return !isBroadcastSetupMissing(error);
}

/** Normalize and de-dupe emails from parent_contacts rows. */
export function uniqueEmailsFromParentRows(
  rows: Array<{ email?: string | null }>,
): string[] {
  const unique = new Set<string>();
  for (const row of rows) {
    const email = String(row.email ?? "")
      .trim()
      .toLowerCase();
    if (email.includes("@") && email.length > 3) unique.add(email);
  }
  return [...unique].sort();
}

/** Unique parent emails from parent_contacts (admin RLS). */
export async function fetchParentBroadcastEmails(): Promise<string[]> {
  const tenantId = await tenantIdForQuery();
  const { data: members, error: memberError } = await withTenantFilter(
    db.from("team_members").select("id"),
    tenantId,
  );
  if (memberError) {
    const rpc = await db.rpc("list_unique_parent_emails", { p_tenant_id: tenantId });
    if (!rpc.error) {
      return uniqueEmailsFromParentRows(rpc.data ?? []);
    }
    throw memberError;
  }
  const memberIds = (members ?? []).map((m: { id: string }) => m.id);
  if (!memberIds.length) return [];

  const { data, error } = await db
    .from("parent_contacts")
    .select("email")
    .in("team_member_id", memberIds);
  if (error) {
    const rpc = await db.rpc("list_unique_parent_emails", { p_tenant_id: tenantId });
    if (!rpc.error) {
      return uniqueEmailsFromParentRows(rpc.data ?? []);
    }
    throw error;
  }

  return uniqueEmailsFromParentRows(data ?? []);
}

/** Unique parent phones from parent_contacts (admin RLS). */
export async function fetchParentBroadcastPhones(): Promise<string[]> {
  const tenantId = await tenantIdForQuery();
  const { data: members, error: memberError } = await withTenantFilter(
    db.from("team_members").select("id"),
    tenantId,
  );
  if (memberError) throw memberError;
  const memberIds = (members ?? []).map((m: { id: string }) => m.id);
  if (!memberIds.length) return [];

  const { data, error } = await db
    .from("parent_contacts")
    .select("phone")
    .in("team_member_id", memberIds);
  if (error) throw error;
  return uniquePhonesFromParentRows(data ?? []);
}

/** Active coach notification emails (CC on parent broadcasts). */
export async function fetchCoachBroadcastEmails(): Promise<string[]> {
  const { fetchCoachCcEmailAddresses } = await import("@/lib/coach-cc-emails");
  return fetchCoachCcEmailAddresses();
}

export async function fetchWhatsAppGroupUrl(): Promise<string> {
  const tenantId = await tenantIdForQuery();
  const { data, error } = await withTenantFilter(
    db.from("broadcast_settings").select("whatsapp_group_url"),
    tenantId,
  ).maybeSingle();

  if (error) {
    if (isBroadcastSetupMissing(error)) return DEFAULT_WHATSAPP_GROUP_URL;
    throw error;
  }

  const url = String(data?.whatsapp_group_url ?? "").trim();
  return url || DEFAULT_WHATSAPP_GROUP_URL;
}

export async function saveWhatsAppGroupUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://chat.whatsapp.com/")) {
    throw new Error("Use a WhatsApp group invite link (https://chat.whatsapp.com/…)");
  }

  const tenantId = await tenantIdForQuery();
  let rowId = 1;
  const { data: existing } = await withTenantFilter(
    db.from("broadcast_settings").select("id"),
    tenantId,
  ).maybeSingle();
  if (existing?.id != null) {
    rowId = existing.id as number;
  }

  const { error } = await db.from("broadcast_settings").upsert(
    {
      id: rowId,
      tenant_id: tenantId,
      whatsapp_group_url: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" },
  );
  if (error) throw error;
}

export function formatBroadcastMessage(subject: string, body: string): string {
  return `*${subject.trim()}*\n\n${body.trim()}`;
}

/** Copy message + open the WhatsApp group invite (paste & send in the group). */
export async function openWhatsAppGroupWithMessage(
  groupUrl: string,
  subject: string,
  body: string,
): Promise<void> {
  const message = formatBroadcastMessage(subject, body);
  try {
    await navigator.clipboard.writeText(message);
  } catch {
    /* still open the group */
  }
  window.open(groupUrl, "_blank", "noopener,noreferrer");
}

/**
 * Opens Gmail (or mailto) with all parent emails in BCC.
 * Works without a verified Resend domain — coach taps Send in their mail app.
 */
export function openParentBroadcastInEmailApp(
  emails: string[],
  subject: string,
  body: string,
): void {
  if (emails.length === 0) throw new Error("No parent emails to send to.");

  const bcc = emails.join(",");
  const su = encodeURIComponent(subject.trim());
  const msg = encodeURIComponent(body.trim());

  // Gmail web compose handles longer BCC lists more reliably than mailto:
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bcc)}&su=${su}&body=${msg}`;
  const opened = window.open(gmail, "_blank", "noopener,noreferrer");

  if (!opened) {
    // Popup blocked — fall back to mailto
    window.location.href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${su}&body=${msg}`;
  }
}

/** Resend test inbox that works without a verified domain (Resend account email). */
export const RESEND_TEST_INBOX = "sravanthi440@gmail.com";

/** Other unique parent emails excluding the Resend test inbox. */
export function otherParentEmails(
  emails: string[],
  keep: string = RESEND_TEST_INBOX,
): string[] {
  const keepLower = keep.trim().toLowerCase();
  return emails.filter((e) => e.trim().toLowerCase() !== keepLower);
}

/** Copy remaining parent emails (comma-separated) for pasting elsewhere. */
export async function copyOtherParentEmails(emails: string[]): Promise<number> {
  const others = otherParentEmails(emails);
  if (others.length === 0) {
    throw new Error("No other parent emails to copy.");
  }
  await navigator.clipboard.writeText(others.join(", "));
  return others.length;
}
