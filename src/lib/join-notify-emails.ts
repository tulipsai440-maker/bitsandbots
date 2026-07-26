import { supabase } from "@/integrations/supabase/client";

export type JoinNotifyEmailRow = {
  id: string;
  email: string;
  label: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const SELECT = "id,email,label,active,sort_order,created_at,updated_at";

function normalize(row: Record<string, unknown>): JoinNotifyEmailRow {
  return {
    id: String(row.id),
    email: String(row.email),
    label: row.label == null ? null : String(row.label),
    active: Boolean(row.active),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function fetchAllJoinNotifyEmails(): Promise<JoinNotifyEmailRow[]> {
  const { data, error } = await supabase
    .from("join_notify_emails")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => normalize(row as unknown as Record<string, unknown>));
}

export async function fetchActiveJoinNotifyEmails(): Promise<JoinNotifyEmailRow[]> {
  const { data, error } = await supabase
    .from("join_notify_emails")
    .select(SELECT)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => normalize(row as unknown as Record<string, unknown>));
}

export async function fetchActiveJoinNotifyEmailAddresses(): Promise<string[]> {
  const rows = await fetchActiveJoinNotifyEmails();
  return rows.map((r) => r.email.trim()).filter(Boolean);
}

export function isJoinNotifyTableMissingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("join_notify_emails") ||
    message.includes("schema cache") ||
    message.includes("PGRST205")
  );
}

export const JOIN_NOTIFY_SETUP_SQL = `-- Join form notification emails (run once in Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS public.join_notify_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  label text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT join_notify_emails_email_unique UNIQUE (email),
  CONSTRAINT join_notify_emails_email_format CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$')
);

GRANT SELECT ON public.join_notify_emails TO anon, authenticated;
GRANT ALL ON public.join_notify_emails TO service_role;
ALTER TABLE public.join_notify_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active join notify emails are public" ON public.join_notify_emails;
CREATE POLICY "Active join notify emails are public"
ON public.join_notify_emails FOR SELECT TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Admins manage join notify emails" ON public.join_notify_emails;
CREATE POLICY "Admins manage join notify emails"
ON public.join_notify_emails FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS join_notify_emails_set_updated_at ON public.join_notify_emails;
CREATE TRIGGER join_notify_emails_set_updated_at
BEFORE UPDATE ON public.join_notify_emails
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.join_notify_emails (email, label, sort_order)
VALUES ('suresh440@gmail.com', 'Troop leader', 1)
ON CONFLICT (email) DO NOTHING;`;
