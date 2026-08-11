import { supabase } from "@/integrations/supabase/client";
import type { JoinNotifyEmailRow } from "@/lib/join-notify-emails";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function saveJoinNotifyEmail(input: {
  id?: string;
  email: string;
  label?: string | null;
  active?: boolean;
  sortOrder?: number;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!email.includes("@")) throw new Error("Enter a valid email address.");

  const payload = {
    email,
    label: input.label?.trim() || null,
    active: input.active ?? true,
    sort_order: input.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("join_notify_emails").update(payload).eq("id", input.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("join_notify_emails").insert(payload);
  if (error) throw error;
}

export async function deleteJoinNotifyEmail(id: string): Promise<void> {
  const { error } = await supabase.from("join_notify_emails").delete().eq("id", id);
  if (error) throw error;
}

export async function setJoinNotifyEmailActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from("join_notify_emails")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export type JoinNotifyEmailFormRow = JoinNotifyEmailRow;
