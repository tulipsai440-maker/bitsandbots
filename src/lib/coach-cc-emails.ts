import { supabase } from "@/integrations/supabase/client";
import { fetchActiveJoinNotifyEmailAddresses } from "@/lib/join-notify-emails";
import { withTenantFilter } from "@/lib/tenant/query";
import { BITSANDBOTS_TENANT_ID } from "@/lib/tenant/types";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

function normalizeList(emails: string[]): string[] {
  const unique = new Set<string>();
  for (const raw of emails) {
    const email = raw.trim().toLowerCase();
    if (email.includes("@")) unique.add(email);
  }
  return [...unique].sort();
}

async function fetchCoachProfileEmails(): Promise<string[]> {
  try {
    const tenantId = await tenantIdForQuery();
    let query = supabase.from("coaches").select("email");
    query = withTenantFilter(query, tenantId);
    const { data, error } = await query;
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("email") && message.includes("column")) return [];
      throw error;
    }
    return normalizeList(
      (data ?? []).map((row) => String((row as { email?: string | null }).email ?? "")),
    );
  } catch {
    return [];
  }
}

/** Coach emails CC'd on parent broadcasts, join notifications, and consent reminders. */
export async function fetchCoachCcEmailAddresses(): Promise<string[]> {
  const [notify, coaches] = await Promise.all([
    fetchActiveJoinNotifyEmailAddresses(),
    fetchCoachProfileEmails(),
  ]);
  return normalizeList([...notify, ...coaches]);
}

/** Server-side — service role read for cron and server functions. */
export async function loadCoachCcEmailsServer(): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const notify: string[] = [];
  const { data: notifyRows, error: notifyError } = await admin
    .from("join_notify_emails")
    .select("email")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (!notifyError) {
    for (const row of notifyRows ?? []) {
      notify.push(String(row.email ?? ""));
    }
  } else {
    console.warn("[coach-cc] join_notify_emails", notifyError.message);
  }

  const coachEmails: string[] = [];
  const { data: coachRows, error: coachError } = await admin
    .from("coaches")
    .select("email")
    .eq("tenant_id", BITSANDBOTS_TENANT_ID);
  if (!coachError) {
    for (const row of coachRows ?? []) {
      coachEmails.push(String(row.email ?? ""));
    }
  } else if (!String(coachError.message).toLowerCase().includes("email")) {
    console.warn("[coach-cc] coaches.email", coachError.message);
  }

  return normalizeList([...notify, ...coachEmails]);
}
