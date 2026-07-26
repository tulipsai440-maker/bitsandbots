import { supabase } from "@/integrations/supabase/client";

export type TroopUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
};

/**
 * Supabase returns plain `{ message, code, hint, details }` objects rather than Error
 * instances, so unwrap them into a real Error that keeps the database code attached.
 */
function toError(error: unknown): Error & { code?: string } {
  if (error instanceof Error) return error;

  if (error && typeof error === "object") {
    const { message, details, hint, code } = error as Record<string, unknown>;
    const text = [message, details, hint].filter(Boolean).join(" — ");
    const wrapped = new Error(text || "Database request failed") as Error & { code?: string };
    if (typeof code === "string") wrapped.code = code;
    return wrapped;
  }

  return new Error(String(error ?? "Database request failed"));
}

export async function fetchTroopUsers(): Promise<TroopUser[]> {
  const { data, error } = await supabase.rpc("list_troop_users");
  if (error) throw toError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email ?? "(no email)",
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
    emailConfirmed: Boolean(row.email_confirmed),
  }));
}

export async function grantTroopAdmin(userId: string): Promise<void> {
  const { error } = await supabase.rpc("grant_troop_admin", { target_user_id: userId });
  if (error) throw toError(error);
}

export async function revokeTroopAdmin(userId: string): Promise<void> {
  const { error } = await supabase.rpc("revoke_troop_admin", { target_user_id: userId });
  if (error) throw toError(error);
}

/** Readable message for the admin UI, whatever shape the failure arrived in. */
export function troopAdminsErrorMessage(error: unknown): string {
  return toError(error).message;
}

/** True when setup-troop-admins.sql has not been run on this Supabase project yet. */
export function isTroopAdminsSetupMissing(error: unknown): boolean {
  const wrapped = toError(error);
  if (wrapped.code === "PGRST202" || wrapped.code === "42883") return true;

  const message = wrapped.message.toLowerCase();
  return (
    message.includes("list_troop_users") ||
    message.includes("grant_troop_admin") ||
    message.includes("revoke_troop_admin") ||
    message.includes("schema cache") ||
    message.includes("pgrst202") ||
    (message.includes("function") && message.includes("does not exist"))
  );
}

export const TROOP_ADMINS_SETUP_SQL = `-- Troop Admins management (run once in the Supabase SQL Editor)
CREATE OR REPLACE FUNCTION public.list_troop_users()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only troop admins can view accounts';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id = u.id AND r.role = 'admin'
    ),
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at IS NOT NULL
  FROM auth.users u
  ORDER BY u.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_troop_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only troop admins can grant admin access';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_troop_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only troop admins can remove admin access';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot remove your own admin access';
  END IF;

  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count <= 1 THEN
    RAISE EXCEPTION 'There must always be at least one admin';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = 'admin';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_troop_users() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.grant_troop_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_troop_admin(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_troop_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_troop_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_troop_admin(uuid) TO authenticated;`;
